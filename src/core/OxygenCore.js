/* eslint-disable no-prototype-builtins */
import glob from 'glob';
import path from 'path';
import fs from 'fs';
import deasync from 'deasync';
import Future from 'fibers/future';
import Fiber from 'fibers';
import { EOL } from 'os';
import StepResult from '../model/step-result';
import OxygenEvents from './OxygenEvents';
import oxutil from '../lib/util';
import * as coreUtils from './utils';
import OxError from '../errors/OxygenError';
import errorHelper from '../errors/helper';
import STATUS from '../model/status.js';
import * as Modules from '../ox_modules/index';

// setup logger
import logger, { DEFAULT_LOGGER_ISSUER, ISSUERS } from '../lib/logger';
import { OxygenSubModule } from './OxygenSubModule';

/*global __stack*/
Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) { return stack; };
        var err = new Error();
        Error.captureStackTrace(err);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_OPTS = {
    backtrace: false, // <boolean> show full backtrace for errors
    compiler: [], // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    failAmbiguousDefinitions: false, // <boolean> treat ambiguous definitions as errors
    failFast: false, // <boolean> abort the run on first failure
    ignoreUndefinedDefinitions: false, // <boolean> treat undefined definitions as warnings
    name: [], // <REGEXP[]> only execute the scenarios with name matching the expression (repeatable)
    profile: [], // <string> (name) specify the profile to use
    require: [], // <string> (file/dir/glob) require files before executing features
    order: 'defined', // <string> switch between deterministic  and random feature execution. Either "defined", "random" or "random:42" whereas 42 is the seed for randomization
    snippetSyntax: undefined, // <string> specify a custom snippet syntax
    snippets: true, // <boolean> hide step definition snippets for pending steps
    source: true, // <boolean> hide source uris
    strict: false, // <boolean> fail if there are any undefined or pending steps
    tagExpression: '', // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagsInTitle: false, // <boolean> add cucumber tags to feature or scenario name
    timeout: DEFAULT_TIMEOUT // <number> timeout for step definitions in milliseconds
};
const MODULE_NAME_MATCH_REGEX = /^module-(.+?)\.js$/;
const SERVICE_NAME_MATCH_REGEX = /^service-(.+?)\.js$/;
const DO_NOT_WRAP_METHODS = ['driver', 'getDriver'];

const DEFAULT_CTX = {
    params: {},
    vars: {},
    env: {},
    caps: {},
    attributes: {},
};
const DEFAULT_RESULT_STORE = {
    steps: [],
    logs: [],
    har: null,
    attributes: {}
};

export default class Oxygen extends OxygenEvents {
    constructor () {
        super();
        this.isInitialized = false;
        this.resultStore = { ...DEFAULT_RESULT_STORE };
        this.ctx = { ...DEFAULT_CTX };
        this.modules = {};
        this.services = {};
        this.repo = {};
        this.capabilities = null;
        this.opts = null;
        this.oxBaseDir = path.join(__dirname, '../');
        this.logger = this._wrapLogger(logger('Oxygen'));
        this._waitStepResultList = [];
    }

    async init(options, caps, ctx = {}, results = {}) {
        this.opts = Object.assign(DEFAULT_OPTS, options);
        this.cwd = this.opts.cwd || process.cwd();
        this.ctx = Object.assign(DEFAULT_CTX, ctx || {});
        this.ctx.caps = { ...ctx.caps || {}, ...caps, };
        this.resultStore = Object.assign(DEFAULT_RESULT_STORE, results || {});
        this.capabilities = this.ctx.caps = caps;

        if (ctx.attributes && (!results.attributes || !Object.keys(results.attributes).length)) {
            this.resultStore.attributes = { ...ctx.attributes };
        }

        // define 'ox' object in global JS scope
        // we will use this object to access Oxygen modules and test context from modules used in the test (if any)        
        this.makeOxGlobal();
        // load services
        this._loadServices();
        // load modules
        this._loadModules();
        // if options.makeModulesGlobal is true or undefined than define 'ctx' content and each module in global scope
        if (typeof options.globalScope === 'undefined' || options.globalScope === true) {
            this.makeContextAndModulesGlobal();
        }
        this.isInitialized = true;
    }

    async disposeModules(status = null) {
        try {
            await this._disposeModules(status);
        }
        catch (e) {
            console.error('Failed to dispose modules: ', e);
            throw e;
        }
    }

    async dispose(status = null) {
        try {
            await this._disposeModules(status);
            await this._disposeServices();
            this.isInitialized = false;
        }
        catch (e) {
            this.isInitialized = false;
            console.error('Failed to dispose: ', e);
            throw e;
        }
    }

    get adjustScriptLine() {
        const isInDebugMode = oxutil.isInDebugMode();
        // add extra line if we are running in debugger mode (V8 debugger adds an extra line at the beginning of the file)
        const result = isInDebugMode ? -1 : 0;
        return result;
    }

    get context() {
        return this.ctx;
    }

    set context(ctx) {
        this.ctx = ctx;
        if (global.ox) {
            global.ox.ctx = ctx;
            if (typeof this.opts.globalScope === 'undefined' || this.opts.globalScope === true) {
                // update "params" and "env" in "ox" global variable
                global.params = ctx.params || {};
                global.env = ctx.env || {};
                global.attributes = ctx.attributes || {};
            }
        }
    }

    get repository() {
        return this.repo;
    }

    set repository(repo) {
        this.repo = repo;
        if (global.ox) {
            global.ox.repo = repo;
        }
    }

    get results() {
        // calculate time for the transaction itself - summary of durations for all the steps in this transaction
        // also adjust transaction end time to much end time for the last executed step within this transaction.
        for (const transStep of this.resultStore.steps) {
            if (transStep.name.includes('.transaction')) {
                const transName = transStep.transaction;
                transStep.duration = 0;
                for (const step of this.resultStore.steps) {
                    // step belongs to the current transaction & is not the transaction step
                    if (step.transaction === transName && step !== transStep) {
                        transStep.duration += step.duration;
                        if (step.endTime > transStep.endTime) {
                            transStep.endTime = step.endTime;
                        }
                    }
                }
            }
        }
        return this.resultStore;
    }

    getModulesCapabilities() {
        if (!this.modules) {
            return null;
        }
        const modCaps = {};
        for (let moduleName in this.modules) {
            const module = this.modules[moduleName];
            if (module.name && module._getCapabilities && typeof module._getCapabilities === 'function') {
                const caps = module._getCapabilities();
                // store only non-empty caps per module that has this.caps property
                if (caps && typeof caps === 'object' && Object.keys(caps).length > 0) {
                    modCaps[module.name] = caps;
                }
            }
        }
        return modCaps;
    }

    resetResults() {
        this.resultStore.steps = [];
        this.resultStore.logs = [];
        this.har = null;
    }

    async onBeforeCase(context) {
        for (let moduleName in this.modules) {
            const module = this.modules[moduleName];
            if (!module) {
                continue;
            }
            try {
                module.onBeforeCase && await module.onBeforeCase(context);
                module._iterationStart && await module._iterationStart();
            }
            catch (e) {
                this.logger.error(`Failed to call "onBeforeCase" method of ${moduleName} module.`, e);
            }
        }
    }

    async onAfterCase(error = null) {
        for (let moduleName in this.modules) {
            const module = this.modules[moduleName];
            if (!module) {
                continue;
            }
            try {
                // await for avoid stuck on *.dispose call
                module.onAfterCase && await module.onAfterCase(error);
                module._iterationEnd && await module._iterationEnd(error);
            }
            catch (e) {
                this.logger.error(`Failed to call "onAfterCase" method of ${moduleName} module.`, e);
            }
        }
    }

    makeOxGlobal() {
        if (!global.ox) {
            global.ox = {
                modules: this.modules,
                ctx: this.ctx,
                options: this.opts,
                caps: this.capabilities,
                resultStore: this.resultStore,
                addAttribute: this.addAttribute.bind(this)
            };

            global.vars = this.ctx.vars;
        }
    }

    makeContextAndModulesGlobal() {
        // make sure 'ox' is already global
        if (global.ox) {
            // expose modules as global variables
            for (let moduleName in this.modules) {
                if (!global[moduleName]) {
                    global[moduleName] = this.modules[moduleName];
                }
            }
            // expose "ctx", "params" and "env" as global variables
            global.params = global.ox.ctx.params;
            global.env = global.ox.ctx.env;
            global.ctx = global.ox.ctx;
            global.attributes = global.ox.ctx.attributes || {};
        }
    }

    addAttribute(name, value) {
        if (this.resultStore && this.resultStore.attributes) {
            this.resultStore.attributes[name] = value;
        }
    }

    loadPageObjectFile(poPath) {
        if (!poPath) {
            return;
        }
        try {
            const po = require(poPath);
            // set page object repository as the main one
            this.repository = po;
            if (typeof this.opts.globalScope === 'undefined' || this.opts.globalScope === true) {
                global.po = po;
            }
        }
        catch (e) {
            // ignore error
            if (typeof this.opts.globalScope === 'undefined' || this.opts.globalScope === true) {
                global.po = {};
            }
        }
    }

    /*
     * Private Methods
     */
    _wrapLogger(_logger) {
        const loggerWrap = {
            info: (...args) => this._log(_logger, 'info', args),
            debug: (...args) => this._log(_logger, 'debug', args),
            error: (...args) => this._log(_logger, 'error', args),
            warn: (...args) => this._log(_logger, 'warn', args),
            userInfo: (...args) => this._log(_logger, 'info', args, ISSUERS.USER),
            userDebug: (...args) => this._log(_logger, 'debug', args, ISSUERS.USER),
            userError: (...args) => this._log(_logger, 'error', args, ISSUERS.USER),
            userWarn: (...args) => this._log(_logger, 'warn', args, ISSUERS.USER),
        };
        return loggerWrap;
    }

    _log(_logger, level, args, src = DEFAULT_LOGGER_ISSUER) {
        if (!_logger[level]) {
            return;
        }
        _logger[level].apply(_logger, args);

        const message = oxutil.stringify(args, 2);
        const time = oxutil.getTimeStamp();
        // add the log entry to the result store
        if (this.resultStore && this.resultStore.logs) {
            this.resultStore.logs.push({
                time: time,
                level: level.toUpperCase(),
                msg: message,
                src: src
            });
        }
        // remove first argument, if it's a message
        args = message ? args.shift() : args;
        this.emitLog(time, level, message, args, src);
    }

    _loadServices() {
        const oxServicesDirPath = path.resolve(this.oxBaseDir, './ox_services');
        const serviceFiles = glob.sync('service-*.js', { cwd: oxServicesDirPath });
        // initialize all services
        this.logger.debug('Loading services...');

        for (var i = 0; i < serviceFiles.length; i++) {
            const serviceFileName = serviceFiles[i];
            const serviceFilePath = path.join(oxServicesDirPath, serviceFileName);
            const result = serviceFileName.match(SERVICE_NAME_MATCH_REGEX);
            const serviceName = result[1];

            // this.opts.services = undefined in single file mode
            if (Array.isArray(this.opts.services) && !this.opts.services.includes(serviceName)) {
                continue;
            }

            try {
                this.logger.debug('Loading service: ' + serviceName);
                const service = this._loadService(serviceName, serviceFilePath);
                service.init();
                this.services[serviceName] = service;
            } catch (e) {
                this.logger.error('Error initializing service "' + serviceName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
            }
        }
    }
    _loadService(serviceName, servicePath) {
        let ServiceClass = require(servicePath);
        // ES6 class will be under 'default' property
        if (ServiceClass.default) {
            ServiceClass = ServiceClass.default;
        }
        const serviceLogger = this._wrapLogger(logger(`Service:${serviceName}`));
        return new ServiceClass(this.opts, this.ctx, this.resultStore, serviceLogger);
    }

    _loadModules() {
        this.logger.debug('Loading internal modules...');
        this._loadInternalModules();
        this.logger.debug('Loading external modules...');
        this._loadExternalModules();
    }

    _loadExternalModules() {
        let modulesFolderPath = './modules';
        if (this.opts.modules_ext && typeof this.opts.modules_ext === 'string') {
            modulesFolderPath = this.opts.modules_ext;
        }
        //const oxModulesDirPath = path.resolve(this.oxBaseDir, './ox_modules');
        const oxModulesDirPath = path.resolve(this.cwd, modulesFolderPath);
        if (!fs.existsSync(oxModulesDirPath)) {
            return false;
        }
        let moduleFiles = [];
        // if particular module names are defined in the config, then load only these modules
        if (Array.isArray(this.opts.modules) && this.opts.modules.length > 0) {
            this.opts.modules.forEach(moduleName => moduleFiles.push(`module-${moduleName}.js`));
        }
        // otherwise, load all available modules (might be more time consuming)
        else {
            moduleFiles = glob.sync('module-*.js', { cwd: oxModulesDirPath });
        }
        // initialize all modules        
        for (let moduleFileName of moduleFiles) {
            // extract name from the module file name based on module name pattern
            const moduleName = moduleFileName.match(MODULE_NAME_MATCH_REGEX)[1];
            try {
                const startTime = new Date();
                // initialize new logger for the module
                const moduleLogger = this._wrapLogger(logger(`Module:${moduleName}`));
                // initialize new module instance
                const mod = coreUtils.loadModuleFromFile(moduleName, moduleFileName, moduleLogger, oxModulesDirPath, this);
                // call onModuleLoaded hook
                this._callServicesOnModuleLoaded(mod);
                // add the module to the module list
                this.modules[moduleName] = global.ox.modules[moduleName] = this._wrapModule(moduleName, mod);
                // wrap up
                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;
                this.logger.debug('Loading module: ' + moduleName + ' [ ' + duration + ' sec ]');
            } catch (e) {
                this.logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
                // ignore any module that failed to load, except Web and Mob modules
                // without Mob and Web modules loaded, the initialization process shall fail
                if (moduleName === 'web' || moduleName === 'mob') {
                    break;
                }
            }
        }
    }

    _loadInternalModules() {
        // if `modules` is empty or undefined in oxygen.conf then load all modules
        // otherwise, load only those implicitly defined
        const excludeUndefinedMods = this.opts.modules && this.opts.modules.length > 0;

        for (let moduleName of Object.keys(Modules)) {
            if (excludeUndefinedMods && !this.opts.modules.includes(moduleName)) {
                continue;
            }
            const ModuleClass = Modules[moduleName];
            const oxModulesDirPath = oxutil.getOxModulesDir();
            try {
                const startTime = new Date();
                // initialize new logger for the module
                const moduleLogger = this._wrapLogger(logger(`Module:${moduleName}`));
                // initialize new module instance
                const mod = coreUtils.loadModuleFromClass(moduleName, ModuleClass, moduleLogger, oxModulesDirPath, this);
                // call onModuleLoaded hook
                this._callServicesOnModuleLoaded(mod);
                // add the module to the module list
                this.modules[moduleName] = global.ox.modules[moduleName] = this._wrapModule(moduleName, mod);
                // wrap up
                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;
                this.logger.debug('Loading module: ' + moduleName + ' [ ' + duration + ' sec ]');
            } catch (e) {
                this.logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
                // ignore any module that failed to load, except Web and Mob modules
                // without Mob and Web modules loaded, the initialization process shall fail
                if (moduleName === 'web' || moduleName === 'mob') {
                    break;
                }
            }
        }
    }

    _wrapModule(name, module) {
        if (!module) {
            return undefined;
        }
        const wrapper = {
            name: name
        };
        const _this = this;
        let moduleMethods = Object.keys(module);
        if (!moduleMethods.some(x => x=== 'exports')) {
            moduleMethods = this._getAllPropertyNames(module);
        }
        for (let methodName of moduleMethods) {
            const method = module[methodName];
            // ignore any module property that is not a function or a OxygenSubModule
            if ((!(method instanceof Function) && !(method instanceof OxygenSubModule) && typeof method !== 'function') || methodName === 'exports' || methodName === '_compile') {
                continue;
            }
            // map and wrap sub-module methods (recursive call to _wrapModule)
            if (method instanceof OxygenSubModule) {
                wrapper[methodName] = this._wrapModule(`${name}.${methodName}`, method);
            }
            // do not wrap methods
            else if (DO_NOT_WRAP_METHODS.includes(methodName)) {
                // === 'driver' || methodName === 'getDriver'
                wrapper[methodName] = module[methodName].bind(module);
            }
            // private methods and event handlers
            else if (methodName.indexOf('_') === 0 || methodName.indexOf('on') === 0) {
                wrapper[methodName] = function() {
                    var args = Array.prototype.slice.call(arguments);

                    _this.logger.debug('Executing: ' + oxutil.getMethodSignature(name, methodName, args));

                    try {
                        return module[methodName].apply(module, args);
                    } catch (e) {
                        throw errorHelper.getOxygenError(e, name, methodName, args);
                    }
                };
            }
            else {
                // create an internal _getCapabilities method for internal Oxygen Core use
                // calling _getCapabilities method won't be visible in the test results
                if (methodName === 'getCapabilities') {
                    wrapper['_getCapabilities'] = method.bind(module);
                }
                wrapper[methodName] = (...args) => {
                    try {
                        return _this._commandWrapper(methodName, args, module, name);
                    }
                    catch (e) {
                        if (e instanceof OxError) {
                            //console.log('Throwing again:', e)
                            throw e;
                        }
                        throw errorHelper.getOxygenError(e, name, methodName, args);
                    }
                };
            }
        }
        return wrapper;
    }

    _commandWrapper(cmdName, cmdArgs, module, moduleName) {
        if (!module || !module[cmdName]) {
            return undefined;
        }

        let retval = null;
        let error = null;
        const cmdFn = module[cmdName];
        const publicMethod = !cmdName.startsWith('_') && cmdName !== 'dispose';

        // delay the command execution if required
        if (
            this.opts.delay &&
            publicMethod &&
            cmdName !== 'init' &&
            cmdName !== 'transaction'
        ) {
            deasync.sleep(this.opts.delay * 1000);
        }

        // throw if a command executed on unitialized module (except internal methods and a few other)
        if (!module.isInitialized && publicMethod && cmdName !== 'init' && cmdName !== 'transaction') {
            throw new OxError(errorHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, 'Missing ' + moduleName + '.init()');
        }

        // dectypt arguments
        let decryptedArgs = this._getDecryptedArgsForApply(cmdArgs, moduleName);
        decryptedArgs = this._populateParametersValue(decryptedArgs);

        // replace parameters in method arguments with corresponding values
        cmdArgs = this._populateParametersValue(cmdArgs);
        // start measuring method execution time
        const startTime = oxutil.getTimeStamp();

        // add command location information (e.g. file name and command line)
        let cmdLocation = null;
        // do not report results or line updates on internal methods (started with '_')
        if (publicMethod) {
            cmdLocation = this._getCommandLocation();
            this.emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, startTime);
        }

        this.logger.debug('Executing: ' + oxutil.getMethodSignature(moduleName, cmdName, cmdArgs));

        try {
            // emit before events
            if (cmdName === 'dispose') {
                this._wrapAsync(this._callServicesOnModuleWillDispose).apply(this, [module]);
            }

            const retvalPromise = this._wrapAsync(module[cmdName]).apply(module, decryptedArgs);

            if (retvalPromise && retvalPromise.then) {
                let promiseDone = false;

                retvalPromise.then((value) => {

                    retval = value;
                    promiseDone = true;
                }, (e) => {
                    error = e;
                    promiseDone = true;
                });

                deasync.loopWhile(() => !promiseDone);
            } else {
                retval = retvalPromise;
            }

            if (cmdName === 'init') {
                this._wrapAsync(this._callServicesOnModuleInitialized).apply(this, [module]);
            }

        } catch (e) {
            if (e && e.message && typeof e.message === 'string' && e.message.includes('invalid session id')) {
                // ignore
                return;
            } else {
                // do nothing if error ocurred after the module was disposed (or in a process of being disposed)
                // except for init methods of course
                if (module &&
                    (typeof module.isInitialized === 'boolean' && !module.isInitialized)
                    && cmdName !== 'init') {
                    return;
                }
                //console.log('==== error ====', e)
                error = errorHelper.getOxygenError(e, moduleName, cmdName, cmdArgs);
            }
        }

        const endTime = oxutil.getTimeStamp();

        let stepResult;
        let done = false;

        if (publicMethod) {
            const waitId = +new Date();
            this._waitStepResultList.push(waitId);

            stepResult = this._getStepResult(module, moduleName, cmdName, cmdArgs, cmdLocation, startTime, endTime, retval, error);

            const index = this._waitStepResultList.indexOf(waitId);
            this._waitStepResultList.splice(index, 1);

            //stepResult.location = cmdLocation;

            this.resultStore.steps.push(stepResult);
            this.emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, endTime, stepResult);
            done = true;
        }

        if (error && error.isFatal && !this.opts.continueOnError) {
            if (!error.location && cmdLocation) {
                error.location = cmdLocation;
            }

            if (stepResult && stepResult.failure && stepResult.failure.location) {
                error.location = stepResult.failure.location;
            }

            throw error;
        }

        if (!publicMethod) {
            done = true;
        }

        deasync.loopWhile(() => !done && !error);

        return retval;
    }

    _wrapAsync (fn, context) {
        return function (...args) {
            var self = context || this;
            // if the current code is not running inside the Fiber context, then run async code as sync using deasync module
            if (!Fiber.current) {
                const retval = fn.apply(self, args);

                let done = false;
                let error = null;
                let finalVal = null;

                if (retval && retval.then) {
                    Promise.resolve(retval)
                    .then((val) => {
                        finalVal = val;
                        done = true;
                    })
                    .catch((e) => {
                        error = e;
                        done = true;
                    });
                } else {
                    finalVal = retval;
                    done = true;
                }

                try {
                    deasync.loopWhile(() => !done && !error);
                }
                catch (e) {

                    if (e && e.message && typeof e.message === 'string' && e.message.includes('readyState')) {
                        return undefined;
                    }

                    // ignore this error as it usually happens 
                    // when Oxygen is disposed and process is being killed
                    this.logger.error('deasync.loopWhile() failed:', e);
                    return undefined;
                }

                if (!error) {
                    return finalVal;
                }
                throw error;
            }

            let error = null;
            let done = false;
            let retval = null;

            try {

                // otherwise, if we are inside the Fiber context, then use Fiber's Future
                const future = new Future();
                var result = fn.apply(self, args);
                if (result && typeof result.then === 'function') {
                    result.then((val) => future.return(val), (err) => future.throw(err));
                    return future.wait();
                }
                return result;

            } catch (e) {
                error = e;
            }

            deasync.loopWhile(() => !done && !error);

            if (!error) {
                return retval;
            }
            throw error;
        };
    }

    // retrieve current line and function name from the call stack
    _getCommandLocation() {
        const stack = __stack;
        let caller = null;
        for (let call of stack) {
            if (__filename === call.getFileName()) {
                continue;
            }
            // return the first caller, which is not the current file
            caller = call;
            break;
        }
        if (caller) {
            return `${caller.getFileName()}:${caller.getLineNumber() + this.adjustScriptLine}:${caller.getColumnNumber()}`;
        }
        return null;
    }

    _getStepResult(module, moduleName, methodName, args, location, startTime, endTime, retval, err) {
        var step = new StepResult();

        step.name = oxutil.getMethodSignature(moduleName, methodName, args);
        step.transaction = global._lastTransactionName || null;                   // FIXME: why is this here if it's already populated in rs?
        step.location = location;

        if (err && err.type && err.type === errorHelper.errorCode.ASSERT_PASSED) {
            step.status = STATUS.PASSED;
        }
        else {
            // determine step status
            if (err) {
                if (err.isFatal) {
                    step.status = STATUS.FAILED;
                }
                else {
                    step.status = STATUS.WARNING;
                }
            }
            else if (moduleName === 'log' && methodName === 'warn') {
                step.status = STATUS.WARNING;
            }
            else {
                step.status = STATUS.PASSED;
            }
        }

        step.action = (typeof module._isAction === 'function' ? module._isAction(methodName) : false);
        step.startTime = startTime;
        step.endTime = endTime;
        step.duration = endTime - startTime;

        if (typeof module._getStats === 'function') {
            step.stats = module._getStats(methodName);
        } else {
            step.stats = {};
        }

        if (err) {
            if (err && err.type && err.type === errorHelper.errorCode.ASSERT_PASSED) {
                //ignore
            } else if (err && err.type && (err.type === errorHelper.errorCode.SELENIUM_SESSION_TIMEOUT || err.type === errorHelper.errorCode.APPIUM_SESSION_TIMEOUT)) {
                //ignore
            } else {
                step.failure = errorHelper.getFailureFromError(err);
                step.failure.location = location;
                // let the module decide whether a screenshot should be taken on error or not

                if (typeof module._takeScreenshotSilent === 'function' && !this.opts.disableScreenshot) {
                    try {
                        step.screenshot = module._takeScreenshotSilent(methodName);
                    }
                    catch (e) {
                        // If we are here, we were unable to get a screenshot
                        // Try to wait for a moment (in Perfecto Cloud, the screenshot might not be immidiately available)
                        deasync.sleep(1000);
                        try {
                            step.screenshot = module._takeScreenshotSilent(methodName);
                        }
                        catch (e) {
                            // FIXME: indicate to user that an attempt to take a screenshot has failed
                        }
                    }
                }
            }
        }
        return step;
    }

    async _disposeServices() {
        if (!this.services || typeof this.services !== 'object') {
            return false;
        }
        for (let key in this.services) {
            const service = this.services[key];
            if (service.dispose) {
                try {
                    await service.dispose();
                }
                catch (e) {
                    // ignore service disposal error
                    this.logger.error(`Failed to dispose service '${key}':`, e);
                }
            }
        }
        return true;
    }

    async _disposeModules(status = null) {
        if (!this.modules || typeof this.modules !== 'object') {
            return false;
        }
        for (let key in this.modules) {
            const mod = this.modules[key];

            if (mod.dispose) {
                try {
                    const disposeResult = mod.dispose(status);
                    if (disposeResult && typeof disposeResult.then === 'function') {
                        // probably a promise
                        await disposeResult();
                    }
                }
                catch (e) {
                    // ignore module disposal error 
                    this.logger.error(`Failed to dispose module '${key}': `, e);
                }
            }
        }
        return true;
    }
    /*
     * Services Event Emitters
     */
    _callServicesOnModuleLoaded(module) {
        for (let serviceName in this.services) {
            const service = this.services[serviceName];
            if (!service) {
                continue;
            }
            try {
                service.onModuleLoaded(module);
            }
            catch (e) {
                this.logger.error(`Failed to call "onModuleLoaded" method of ${serviceName} service.`, e);
            }
        }
    }
    async _callServicesOnModuleInitialized(module) {
        for (let serviceName in this.services) {
            const service = this.services[serviceName];
            if (!service) {
                continue;
            }
            try {
                await service.onModuleInitialized(module);
            }
            catch (e) {
                this.logger.error(`Failed to call "onModuleInitialized" method of ${serviceName} service.`, e);
            }
        }
    }
    async _callServicesOnModuleWillDispose(module) {
        if (!this || !this.services) {
            return;
        }
        for (let serviceName in this.services) {
            const service = this.services[serviceName];
            if (!service) {
                continue;
            }
            try {
                if (service.onModuleWillDispose) {
                    service.onModuleWillDispose(module);
                }
            }
            catch (e) {
                this.logger.error(`Failed to call "onModuleWillDispose" method of ${serviceName} service.`, e);
            }
        }
    }
    _populateParametersValue(args) {
        if (!args || !Array.isArray(args) || args.length == 0) {
            return args;
        }
        const _newArgs = [];
        for (let arg of args) {
            _newArgs.push(this._replaceParameterInArgument(arg));
        }
        return _newArgs;
    }
    _replaceParameterInArgument(arg) {
        if (arg && typeof arg.getDecryptResult === 'function') {
            return 'ENCRYPTED';
        }

        if (!arg || typeof arg !== 'string') {
            return arg;
        }
        // replace user parameters with values
        // note: user parameter with the same name takes precedence over environment variable
        for (let paramName in this.ctx.params) {
            if (this.ctx.params.hasOwnProperty(paramName))
            {
                const paramValue = this.ctx.params[paramName];
                arg = arg.replace(new RegExp('\\${' + paramName + '}', 'g'), paramValue);
            }
        }
        // replace environment variables with values
        for (let envName in this.ctx.env) {
            if (this.ctx.env.hasOwnProperty(envName))
            {
                const envValue = this.ctx.env[envName];
                arg = arg.replace(new RegExp('\\${' + envName + '}', 'g'), envValue);
            }
        }
        return arg;
    }
    _getAllPropertyNames( obj ) {
        const props = [];

        do {
            Object.getOwnPropertyNames( obj ).forEach(function ( prop ) {
                if ( props.indexOf( prop ) === -1 ) {
                    props.push( prop );
                }
            });
            // eslint-disable-next-line no-cond-assign
        } while ( obj = Object.getPrototypeOf( obj ) );

        return props;
    }

    _checkStepResult(resolve, reject) {
        if (this._waitStepResultList.length === 0) {
            resolve();
        } else {
            this._checkStepResult(resolve, reject);
        }
    }

    _waitStepResult() {
        return new Promise((resolve, reject) => {
            this._checkStepResult(resolve, reject);
        });
    }

    _getDecryptedArgsForApply(args, moduleName) {
        if (!args || !Array.isArray(args) || args.length == 0) {
            return args;
        }
        const _newArgs = [];
        for (let arg of args) {
            _newArgs.push(this._decryptParameterForApplyInArgument(arg, moduleName));
        }
        return _newArgs;
    }

    _decryptParameterForApplyInArgument(arg, moduleName) {
        if (arg && typeof arg.getDecryptResult === 'function') {
            if (moduleName === 'log') {
                return 'ENCRYPTED';
            } else {
                return arg.getDecryptResult();
            }
        }

        return arg;
    }
}
