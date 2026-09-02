import path from 'path';
import fs from 'fs';
import oxutil from './util';
import { forEach } from 'async';
import moduleRequire from './moduleRequire';

export const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';
export const OXYGEN_ENV_FILE_NAME = 'oxygen.env';
export const OXYGEN_PAGE_OBJECT_FILE_NAME = 'oxygen.po';
export const DEFAULT_REPORTER = 'html';

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
    const isConfigFile = target && (
        (target.name && target.name.indexOf(OXYGEN_CONFIG_FILE_NAME) === 0)
        || (target.extension === '' && target.configPath && target.configPath.indexOf(OXYGEN_CONFIG_FILE_NAME) > -1)
    );
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

/*
 * Nearest oxygen.conf.js (or .json) at or above `startDir`, or undefined if there is none
 * all the way to the filesystem root.
 */
export function findConfigFileUpwards(startDir) {
    let dir = path.resolve(startDir);
    for (;;) {
        for (const extension of ['.js', '.json']) {
            const candidate = path.join(dir, OXYGEN_CONFIG_FILE_NAME + extension);
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return undefined;
        }
        dir = parent;
    }
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
        appiumUrl : 'http://localhost:4723/',
        reopenSession: false,
        reRunOnFailed: false,
        iterations : 1,
        debugPort: null,
        delay: null,
        collectDeviceLogs: false,
        collectAppiumLogs: false,
        collectBrowserLogs: false,
        reporting: {
            reporters: [DEFAULT_REPORTER]
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
    else if (target && target.configPath) {
        try {
            projConfigOpts = moduleRequire(target.configPath);
        } catch (e) {
            const err = new Error(`Unable to load file: ${target.configPath}. Reason: ${e.message} ${e.stack}`);
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
        projConfigOpts.reporting.reporters = [DEFAULT_REPORTER];
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

/*
 * Add the browser flags that keep a run off the screen.
 *
 * A visible browser steals keyboard focus every time it opens, which makes the machine
 * unusable while a suite or an agent loop is running - and an agent driving a session has
 * no reason to want a window at all. Applied to the capabilities rather than the options
 * so it survives whatever the project config already declares: an existing args array is
 * extended, never replaced.
 *
 * Headless Chrome defaults to a small window, and a narrow viewport changes which elements
 * a responsive application renders - so a size is set alongside, or tests would pass
 * headed and fail headless for reasons that have nothing to do with the test.
 */
export function applyHeadless(caps = {}, argv = {}) {
    if (argv.headless === undefined || argv.headless === 'false' || argv.headless === false) {
        return caps;
    }
    const browserName = (caps.browserName || 'chrome').toLowerCase();
    const result = { ...caps };
    if (browserName === 'firefox') {
        const existing = result['moz:firefoxOptions'] || {};
        result['moz:firefoxOptions'] = {
            ...existing,
            args: [...(existing.args || []), '-headless', '--width=1920', '--height=1080'],
        };
        return result;
    }
    const existing = result['goog:chromeOptions'] || {};
    result['goog:chromeOptions'] = {
        ...existing,
        args: [...(existing.args || []), '--headless=new', '--window-size=1920,1080'],
    };
    return result;
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
        wsPort: argv.wsport || null,
        delay: argv.d || argv.delay || null,
    };
    // These two are only meaningful when the user actually passed the flag. Defaulting
    // them to `false` here would put a real value into cmdOpts, and since command line
    // options are merged last, that silently overrode whatever oxygen.conf.js declared -
    // making `autoStartWebDriver: true` in a project config impossible to honour.
    if (typeof argv.autowd !== 'undefined') {
        opts.autoStartWebDriver = argv.autowd === 'true' || argv.autowd === true;
    }
    if (typeof argv.baseline !== 'undefined') {
        opts.baseline = argv.baseline === 'true' || argv.baseline === true;
    }
    // step-level: keep running the case after a failed command
    if (typeof argv.continueOnError !== 'undefined') {
        opts.continueOnError = argv.continueOnError === 'true' || argv.continueOnError === true;
    }
    // suite-level: stop running further cases once one has failed
    if (typeof argv.stopSuiteOnCaseFailure !== 'undefined') {
        opts.stopSuiteOnCaseFailure = argv.stopSuiteOnCaseFailure === 'true' || argv.stopSuiteOnCaseFailure === true;
    }
    const timeoutSeconds = parseFloat(argv.timeout);
    if (!isNaN(timeoutSeconds) && timeoutSeconds > 0) {
        opts.timeout = timeoutSeconds * 1000;
    }
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

export function processTargetPath(targetPath, userCwd) {
    let cwd = userCwd || process.cwd();
    // get current working directory if user has not provided path
    if (typeof(targetPath) === 'undefined') {
        targetPath = cwd;
    }
    // user's path might be relative to the current working directory - make sure the relative path will work
    else {
        targetPath = oxutil.resolvePath(targetPath, cwd);
    }

    if (!fs.existsSync(targetPath)) {
        return null;
    }

    const stats = fs.lstatSync(targetPath);
    const isDirector = stats.isDirectory();
    let configFilePath;
    // true when the config was found above the directory the search started in - the one
    // case worth telling the user about, since it silently widens the project scope
    let configFromAncestor = false;
    if (isDirector) {
        // if "target" provided by the user is a directory,
        // then unless "cwd" is provided explicitly by the user
        // use target directory as cwd
        cwd = userCwd || targetPath;
        // append oxygen config file name to the directory, if no test case file was provided
        configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.js');
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.json');
            if (!fs.existsSync(configFilePath)) {
                return null;
            }
        }
    }
    else if (targetPath.endsWith(OXYGEN_CONFIG_FILE_NAME + '.js') || targetPath.endsWith(OXYGEN_CONFIG_FILE_NAME + '.json')) {
        configFilePath = targetPath;
        cwd = targetPath = path.dirname(targetPath);
    }
    else {
        // A test file usually sits in a sub folder of the project (cases/login.js), while
        // oxygen.conf.js sits at the root. Looking only beside the file meant such a run
        // silently got no project configuration at all - no capabilities, no page
        // objects, no environments - and failed later in a way that pointed nowhere near
        // the real cause. Search upwards so the file picks up the project it belongs to.
        const startDir = userCwd || path.dirname(targetPath);
        configFilePath = findConfigFileUpwards(startDir);
        // the directory holding the config is the project root, and every relative path in
        // it - page objects, suites, report output - resolves against that root
        cwd = userCwd || (configFilePath ? path.dirname(configFilePath) : startDir);
        configFromAncestor = !!configFilePath && path.resolve(path.dirname(configFilePath)) !== path.resolve(startDir);
    }
    if (!targetPath) {
        return null;
    }
    return {
        // path to the config or .js file
        path: targetPath,
        configPath: configFilePath,
        configFromAncestor,
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