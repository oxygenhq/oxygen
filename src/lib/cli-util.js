import path from 'path';
import fs from 'fs';
import oxutil from './util';

export const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';
export const OXYGEN_ENV_FILE_NAME = 'oxygen.env';

export async function generateTestOptions(config, argv) {
    const options = { ...config };
    options.env = loadEnvironmentVariables(config, argv);
    options.suites = await loadSuites(config, argv);
    return options;
}

export async function loadSuites(config, argv) {
    const { target } = config;    
    const isConfigFile = target.name && target.name.indexOf(OXYGEN_CONFIG_FILE_NAME) === 0;
    let suites = [];
    // if an individual script or suite file was passed
    if (!isConfigFile) {
        if (target.extension === '.js') {
            suites.push(await oxutil.generateTestSuiteFromJSFile(target.path, config.parameters.file, config.parameters.mode));
        }
        else if (targetFile.extension === '.json') {
            suites.push(await oxutil.generateTestSuiteFromJsonFile(target.path, config.parameters.file, config.parameters.mode, config));
        }
    }    
    // if a folder or a configuration file was passed
    else {
        if (config.suites && Array.isArray(config.suites)) {
            suites = config.suites;
        }
        else {
            const suitesFolder = path.join(target.cwd, 'suites');
            if (path.existsSync(suitesFolder)) {
                suites = loadSuitesFromFolder(suitesFolder);
                // filter out suites if '--suites' command line argument was specified
                if (argv.suites && typeof argv.suites === 'string') {
                    const selectedSuiteNames = argv.suites.split(',');
                    suites = suites.filter(x => selectedSuiteNames.contains(x.name));
                }
            }
        }        
    }
    return suites;
}

export function loadSuitesFromFolder(folderPath) {
    throw new Error('Not implemented.');
}

export function loadEnvironmentVariables(config, argv) {
    const target = config.target;
    const envName = argv.env || 'default';
    const cwd = target.cwd || process.cwd();
    const defaultEnvFile = path.join(cwd, `${OXYGEN_ENV_FILE_NAME}.js`);
    if (fs.existsSync(defaultEnvFile)) {
        const env = require(defaultEnvFile);
        if (env && typeof env === 'object' && env.hasOwnProperty(envName)) {
            return env[envName];
        }
    }
    // try to resolve a dedicated environment file in 'env' sub folder
    const dedicatedEnvFileJs = path.join(cwd, 'env', `${envName}.js`);
    const dedicatedEnvFileJson = path.join(cwd, 'env', `${envName}.json`);
    if (fs.existsSync(dedicatedEnvFileJs)) {
        return require(dedicatedEnvFileJs);
    }
    else if (fs.existsSync(dedicatedEnvFileJson)) {
        return require(dedicatedEnvFileJson);
    }
    return {};
}

export function getConfigurations(target, argv) {
    // process command line arguments
    const startupOpts = {
        name: argv.name || null,
        cwd: target.cwd,
        target: target,
        browserName : argv.b || argv.browser || 'chrome',
        seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
        host: argv.host || 'localhost',
        port: argv.port || 4723,
        reopenSession: argv.reopen ? argv.reopen === 'true' : false,
        iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
        debugPort: argv.dbgport || null,
        delay: argv.delay || null,
        collectDeviceLogs: false,
        collectAppiumLogs: false,
        collectBrowserLogs: false,
        parameters : {
            file: argv.p || argv.param || null,
            mode: argv.pm || 'seq'
        },
    };

    // if the target is oxygen config file, merge its content with the default options
    let moreOpts = {};
    if (target.name === OXYGEN_CONFIG_FILE_NAME && (target.extension === '.js' || target.extension === '.json')) {
        moreOpts = require(target.path);
    } 

    // determine test name
    let name = startupOpts.name || moreOpts.name || null;
    if (!name) {
        name = target.name !== OXYGEN_CONFIG_FILE_NAME ? target.name : target.baseName;
    }

    return { name: name, ...startupOpts, ...moreOpts }
}

export function processTargetPath(targetPath) {
    // get current working directory if user has not provided path
    if (typeof(targetPath) === 'undefined') {
        targetPath = process.cwd();
    }
    // user's path might be relative to the current working directory - make sure the relative path will work
    else {
        targetPath = oxutil.resolvePath(targetPath, process.cwd());
    }
    const stats = fs.lstatSync(targetPath);
    const isDirector = stats.isDirectory();
    if (isDirector) {
        // append oxygen config file name to the directory, if no test case file was provided
        let configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.js');
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.json');
            if (!fs.existsSync(configFilePath)) {
                return null;
            }
        }
        targetPath = configFilePath;
    }
    if (!fs.existsSync(targetPath)) {
        return null;
    }
    return {
        // path to the config or .js file
        path: targetPath,
        // working directory
        cwd: path.dirname(targetPath),
        // name of the target file without extension
        name: oxutil.getFileNameWithoutExt(targetPath),        
        // name including extension
        fullName: path.basename(targetPath),
        // parent folder's name
        baseName: path.basename(path.dirname(targetPath)),
        // target file extension
        extension: path.extname(targetPath)
    };
}