import path from 'path';
import fs from 'fs';
import oxutil from './util';
import { forEach } from 'async';
import moduleRequire from './moduleRequire';

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
        let suiteDefs = [];
        if (config.suites && Array.isArray(config.suites)) {
            suiteDefs = config.suites;
        }
        // check if more suites are defined in the 'suites' folder
        const suitesFolder = path.join(target.cwd, 'suites');
        if (fs.existsSync(suitesFolder)) {
            suiteDefs = [
                ...suiteDefs,
                ...loadSuiteDefinitionsFromFolder(suitesFolder)
            ];
        }
        // merge suites configured in the project config file and those found in 'suites' folder
        suites = await Promise.all(suiteDefs.map(async (suiteDef) => await oxutil.generateTestSuiteFromJson(suiteDef, config)));
    }
    // filter out suites if '--suites' command line argument was specified
    if (argv.suites && typeof argv.suites === 'string') {
        const selectedSuiteNames = argv.suites.split(',');
        suites = suites.filter(x => selectedSuiteNames.includes(x.name));
    }
    return suites;
}

export function loadSuiteDefinitionsFromFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    let suiteDefs = [];
    forEach(files, file => {
        if (path.extname(file) === '.json') {
            const fullPath = path.join(folderPath, file);
            suiteDefs.push(moduleRequire(fullPath));
        }
    });
    return suiteDefs;
}

export function getPageObjectFilePath(config, argv = {}) {
    const target = config.target || {};
    const poFileName = argv.po || `${OXYGEN_PAGE_OBJECT_FILE_NAME}.js`;
    const cwd = target.cwd || process.cwd();
    let poFilePath = path.resolve(cwd, poFileName);
    poFilePath = fs.existsSync(poFilePath) ? poFilePath : null;

    if (poFilePath) {
        try {
            moduleRequire(poFilePath);
            return poFilePath;
        } catch (e) {
            const err = new Error(`Unable to load file: ${poFilePath}. Reason: ${e.message} ${e.stack}`);
            throw err;
        }
    } else {
        return null;
    }
}

export function loadEnvironmentVariables(config, argv) {
    const target = config.target || {};
    const envName = argv.env || config.environment || 'default';
    const cwd = target.cwd || process.cwd();
    const defaultEnvFile = path.join(cwd, `${OXYGEN_ENV_FILE_NAME}.js`);
    if (fs.existsSync(defaultEnvFile)) {
        const env = moduleRequire(defaultEnvFile);
        if (env && typeof env === 'object' && Object.prototype.hasOwnProperty.call(env, envName)) {
            return env[envName];
        }
    }
    // try to resolve a dedicated environment file in 'env' sub folder
    const dedicatedEnvFileJs = path.join(cwd, 'env', `${envName}.js`);
    const dedicatedEnvFileJson = path.join(cwd, 'env', `${envName}.json`);
    if (fs.existsSync(dedicatedEnvFileJs)) {
        return moduleRequire(dedicatedEnvFileJs);
    }
    else if (fs.existsSync(dedicatedEnvFileJson)) {
        return moduleRequire(dedicatedEnvFileJson);
    }
    return {};
}

export function getEnvironments(target) {
    let targetCwd = null;

    if (target && target.cwd) {
        targetCwd = target.cwd;
    }

    const cwd = targetCwd || process.cwd();
    const defaultEnvFile = path.join(cwd, `${OXYGEN_ENV_FILE_NAME}.js`);
    if (fs.existsSync(defaultEnvFile)) {
        try {
            return moduleRequire(defaultEnvFile);
        } catch (e) {
            const err = new Error(`Unable to load file: ${defaultEnvFile}. Reason: ${e.message} ${e.stack}`);
            throw err;
        }
    }
    return {};
}

export function getConfigurations(target, argv) {
    // process command line arguments
    let targetCwd = null;

    if (target && target.cwd) {
        targetCwd = target.cwd;
    }

    const DEFAULT_OPTS = {
        cwd: target ? (targetCwd || process.cwd()) : process.cwd(),
        target: target,
        browserName: 'chrome',
        seleniumUrl : 'http://localhost:4444/wd/hub',
        appiumUrl : 'http://localhost:4723/wd/hub',
        reopenSession: false,
        reRunOnFailed: false,
        iterations : 1,
        debugPort: null,
        delay: null,
        collectDeviceLogs: false,
        collectAppiumLogs: false,
        collectBrowserLogs: false,
        reporting: {
            reporters: ['html']
        },
        parameters : {
            file: null,
            mode: 'seq'
        },
    };
    // retrieve options provided via command line arguments
    const cmdOpts = getCommandLineOptions(argv);
    // if the target is oxygen config file, merge its content with the default options
    let projConfigOpts = {};
    if (target && target.name === OXYGEN_CONFIG_FILE_NAME && (target.extension === '.js' || target.extension === '.json')) {
        try {
            projConfigOpts = moduleRequire(target.path);
        } catch (e) {
            const err = new Error(`Unable to load file: ${target.path}. Reason: ${e.message} ${e.stack}`);
            throw err;
        }
    }
    const envs = getEnvironments(target);

    if (projConfigOpts.envs) {
        // merge external environments definition with the one in the config file
        projConfigOpts.envs = { ...projConfigOpts.envs, ...envs };
    }
    else {
        projConfigOpts = { ...projConfigOpts, envs: envs };
    }
    // make sure to set default HTML reporter if reporting options are not provided in oxygen.conf file and via command line
    const isCmdOptsReportFormat = cmdOpts.reporting && cmdOpts.reporting.reporters;
    const isConfigReportFormat = projConfigOpts.reporting && projConfigOpts.reporting.reporters;
    if (!isCmdOptsReportFormat && !isConfigReportFormat) {
        if (!projConfigOpts.reporting) {
            projConfigOpts.reporting = {};
        }
        projConfigOpts.reporting.reporters = ['html'];
    }
    // determine test name
    let name = cmdOpts.name || projConfigOpts.name || null;
    if (!name && target) {
        name = target.name !== OXYGEN_CONFIG_FILE_NAME ? target.name : target.baseName;
    }
    // merge options according to the following order (the last one overrides the previous one):
    // default options, project config file, command line arguments
    return { ...DEFAULT_OPTS, ...projConfigOpts, ...cmdOpts, name: name };
}

export function getCommandLineOptions(argv) {
    const opts = {
        // switch: --name 
        name: argv.name || null,
        // switch: -b or --browser
        browserName : argv.b || argv.browser || null,
        seleniumUrl : argv.s || argv.server || null,
        appiumUrl : argv.s || argv.server || null,
        reopenSession: argv.reopen ? argv.reopen === 'true' : null,
        iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
        debugPort: argv.dbgport || null,
        delay: argv.d || argv.delay || null,
    };
    // switch: --rf flag
    if (argv.rf && typeof argv.rf === 'string' && argv.rf.length > 0) {
        const reportFormats = argv.rf.split(',');
        opts.reporting = {
            reporters: reportFormats
        };
        // switch: --ro - set reporter output directory if set by user through comnand line
        // NOTE: --ro switch must be specified together with --rf
        if (argv.ro && typeof argv.ro === 'string' && argv.ro.length > 0) {
            opts.reporting.outputDir = argv.ro;
        }
    }
    // option: -p or --param and --pm
    if (argv.p || argv.param) {
        opts.parameters = {
            file: argv.p || argv.param || null,
            mode: argv.pm || 'seq'
        };
    }

    // switch: --specs - set specs if set by user through comnand line
    if (argv.specs && typeof argv.specs === 'string' && argv.specs.length > 0) {
        const specs = argv.specs.split(',');
        opts.specs = specs;
    }
    // switch: --modules - set a list of modules to be loaded, if set by user through comnand line
    if (argv.modules && typeof argv.modules === 'string' && argv.modules.length > 0) {
        const modules = argv.modules.split(',');
        opts.modules = modules;
    }
    // remove any property with null value (so it won't override default values if it's null)
    return deleteNullProperties(opts);
}

function deleteNullProperties(obj) {
    if (typeof obj !== 'object') {
        return obj;
    }
    const clone = { ...obj };
    const keys = Object.keys(obj);
    forEach (keys, key => {
        if (Object.prototype.hasOwnProperty.call(obj, key) && (obj[key] == null || obj[key] == undefined)) {
            delete clone[key];
        }
    });
    return clone;
}

export function processTargetPath(targetPath, cwd) {
    // get current working directory if user has not provided path
    if (typeof(targetPath) === 'undefined') {
        targetPath = cwd || process.cwd();
    }
    // user's path might be relative to the current working directory - make sure the relative path will work
    else {
        targetPath = oxutil.resolvePath(targetPath, cwd || process.cwd());
    }

    if (!fs.existsSync(targetPath)) {
        return null;
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
        cwd: cwd || path.dirname(targetPath),
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