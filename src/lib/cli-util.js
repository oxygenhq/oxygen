import path from 'path';
import fs from 'fs';
import oxutil from './util';

export const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';
export const OXYGEN_ENV_FILE_NAME = 'oxygen.env';
export const OXYGEN_PAGE_OBJECT_FILE_NAME = 'oxygen.po';

export async function generateTestOptions(config, argv) {
    const options = { ...config };
    options.env = loadEnvironmentVariables(config, argv);
    options.po = getPageObjectFilePath(config, argv);
    options.suites = await loadSuites(config, argv);
    return options;
}

export async function loadSuites(config, argv) {
    if (config.framework && typeof config.framework === 'string' && config.framework.toLowerCase() !== 'oxygen') {
        return;
    }
    const { target } = config;
    const isConfigFile = target && target.name && target.name.indexOf(OXYGEN_CONFIG_FILE_NAME) === 0;
    let suites = [];
    // if an individual script or suite file was passed
    if (!isConfigFile) {
        if (target && target.extension === '.js') {
            suites.push(await oxutil.generateTestSuiteFromJSFile(target.path, config.parameters.file, config.parameters.mode, false, config.iterations || 1));
        }
        else if (target && target.extension === '.json') {
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
            }
        }
    }
    // filter out suites if '--suites' command line argument was specified
    if (argv.suites && typeof argv.suites === 'string') {
        const selectedSuiteNames = argv.suites.split(',');
        suites = suites.filter(x => selectedSuiteNames.includes(x.name));
    }
    
    return suites;
}

export function loadSuitesFromFolder(folderPath) {
    throw new Error('Not implemented.');
}

export function getPageObjectFilePath(config, argv = {}) {
    const target = config.target || {};
    const poFileName = argv.po || `${OXYGEN_PAGE_OBJECT_FILE_NAME}.js`;
    const cwd = target.cwd || process.cwd();
    const poFilePath = path.resolve(cwd, poFileName);
    return fs.existsSync(poFilePath) ? poFilePath : null;
}

export function loadEnvironmentVariables(config, argv) {
    const target = config.target || {};
    const envName = argv.env || 'default';
    const cwd = target.cwd || process.cwd();
    const defaultEnvFile = path.join(cwd, `${OXYGEN_ENV_FILE_NAME}.js`);
    if (fs.existsSync(defaultEnvFile)) {
        const env = require(defaultEnvFile);
        if (env && typeof env === 'object' && Object.prototype.hasOwnProperty.call(env, envName)) {
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
        cwd: target ? (target.cwd || process.cwd()) : process.cwd(),
        target: target,
        browserName : argv.b || argv.browser || 'chrome',
        seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
        appiumUrl : argv.s || argv.server || 'http://localhost:4723/wd/hub',
        reopenSession: argv.reopen ? argv.reopen === 'true' : false,
        iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
        debugPort: argv.dbgport || null,
        delay: argv.delay || null,
        collectDeviceLogs: false,
        collectAppiumLogs: false,
        collectBrowserLogs: false,
        reporting: {
            reporters: ['html']
        },
        parameters : {
            file: argv.p || argv.param || null,
            mode: argv.pm || 'seq'
        },
    };    
    // if the target is oxygen config file, merge its content with the default options
    let moreOpts = { reporting: {} };
    if (target && target.name === OXYGEN_CONFIG_FILE_NAME && (target.extension === '.js' || target.extension === '.json')) {
        moreOpts = require(target.path);
    } 
    // override test options with user settings set via command line arguments

    // set reporters if set by user through comnand line (--rf switch)
    if (argv.rf && typeof argv.rf === 'string' && argv.rf.length > 0) {
        const reporters = argv.rf.split(',');
        moreOpts.reporting.reporters = reporters;
    }
    // set specs if set by user through comnand line (--specs switch)
    if (argv.specs && typeof argv.specs === 'string' && argv.specs.length > 0) {
        const specs = argv.specs.split(',');
        moreOpts.specs = specs;
    }
    // set a list of modules to be loaded, if set by user through comnand line (--modules switch)
    if (argv.modules && typeof argv.modules === 'string' && argv.modules.length > 0) {
        const modules = argv.modules.split(',');
        moreOpts.modules = modules;
    }
    // determine test name
    let name = startupOpts.name || moreOpts.name || null;
    if (!name && target) {
        name = target.name !== OXYGEN_CONFIG_FILE_NAME ? target.name : target.baseName;
    }

    return { ...startupOpts, ...moreOpts, name: name };
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