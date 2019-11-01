import globule from 'globule';
import path from 'path';
import fs from 'fs';
import deasync from 'deasync';
import Future from 'fibers/future';
import Fiber from 'fibers';
import { EOL } from 'os';
// wdio async
import {
    executeHooksWithArgs,
    executeSync,
    executeAsync
} from '@wdio/sync' //'wdio-sync';
import { isFunctionAsync } from '@wdio/utils';
import { hasWdioSyncSupport, runFnInFiberContext } from '@wdio/config';


import StepResult from '../model/step-result';
import OxygenEvents from './OxygenEvents';
import oxutil from '../lib/util';
import OxError from '../errors/OxygenError';
import errorHelper from '../errors/helper';
import STATUS from '../model/status.js';

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

/*global __line*/
Object.defineProperty(global, '__line', {
    get: function () {
        const scriptContentLineOffset = 1;
        const scriptPath = null;
        if (scriptPath) {
            for (var call of __stack) {
                if (call.getFileName() === scriptPath) {
                    return call.getLineNumber() - scriptContentLineOffset - 1;
                }
            }
        }
        return __stack[1].getLineNumber() - scriptContentLineOffset - 1;
    }
});

/* global __lineStack */
Object.defineProperty(global, '__lineStack', {
    get: function () {
        const lines = [];
        const scriptPath = null;
        for (var call of __stack) {           
            const callFileName = call.getFileName(); 
            if (callFileName && callFileName.indexOf('script-boilerplate.js') === -1) {
                let line = call.getLineNumber();
                // adjust the file line if the call is made from the main script file (due to Fiber code wrap)
                if (scriptPath && callFileName === scriptPath) {
                    line = line - scriptContentLineOffset - 1;
                }
                lines.push({
                    line: line,
                    file: callFileName,
                });
            }
        }        
        return lines;
    }
});


const DEFAULT_TIMEOUT = 30000
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
}
const MODULE_NAME_MATCH_REGEX = /^module-(.+?)\.js$/;
const SERVICE_NAME_MATCH_REGEX = /^service-(.+?)\.js$/;
const logger = console;
const DEFAULT_CTX = {
    params: {},
    vars: {},
    env: {},
    caps: {}
};
const DEFAULT_RESULT_STORE = {
    steps: [],
    logs: []
};

export default class Oxygen extends OxygenEvents {
    constructor () {
        super()
        this.isInitialized = false;
        this.resultStore = { ...DEFAULT_RESULT_STORE };
        this.ctx = { ...DEFAULT_CTX };
        this.modules = {};
        this.services = {};
        this.capabilities = null;
        this.opts = null;
        this.oxBaseDir = path.join(__dirname, `../`);
    }

    async init(options, caps, ctx = {}, results = {}) {
        this.opts = Object.assign(DEFAULT_OPTS, options);
        this.cwd = this.opts.cwd || process.cwd();
        this.ctx = Object.assign(DEFAULT_CTX, ctx || {});
        this.resultStore = Object.assign(DEFAULT_RESULT_STORE, results || {});
        this.capabilities = this.ctx.caps = caps;
        
        // define 'ox' object in global JS scope
        // we will use this object to access Oxygen modules and test context from modules used in the test (if any)
        global.ox = { 
            modules: this.modules,
            ctx: this.ctx,
            options: this.opts,
            caps: this.capabilities,
            resultStore: this.resultStore
        };
        this._loadServices();
        this._loadModules();

        this.isInitialized = true
    }

    async dispose() {
        try {
            await this._disposeModules();
            await this._disposeServices();
            this.isInitialized = false;
        }
        catch (e) {
            this.isInitialized = false;
            console.error('Failed to dispose: ', e)
            throw e;    
        }        
    }

    /*
     * Private Methods
     */
    _loadServices() {
        const oxServicesDirPath = path.resolve(this.oxBaseDir, './ox_services');
        const serviceFiles = globule.find('service-*.js', { srcBase: oxServicesDirPath });
        // initialize all services
        logger.debug('Loading services...');
        let err = null;
        
        for (var i = 0; i < serviceFiles.length; i++) {
            const serviceFileName = serviceFiles[i];
            const serviceFilePath = path.join(oxServicesDirPath, serviceFileName);
            const result = serviceFileName.match(SERVICE_NAME_MATCH_REGEX);
            const serviceName = result[1];
    
            try {
                const service = this._loadService(serviceFilePath);
                service.init();
                this.services[serviceName] = service;
            } catch (e) {
                logger.error('Error initializing service "' + serviceName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
            }
        }        
    }
    _loadService(servicePath, opts) {
        let ServiceClass = require(servicePath);
        // ES6 class will be under 'default' property
        if (ServiceClass.default) {
            ServiceClass = ServiceClass.default;
        }
        return new ServiceClass(this.opts, this.ctx, this.resultStore, logger);
    }
    _loadModules() {
        const oxModulesDirPath = path.resolve(this.oxBaseDir, './ox_modules');
        const moduleFiles = globule.find('module-*.js', { srcBase: oxModulesDirPath });
        // initialize all modules
        logger.debug('Loading modules...');
        let err = null;
        let moduleName;
        for (var i = 0; i < moduleFiles.length; i++) {
            let moduleFileName = moduleFiles[i];
            let result = moduleFileName.match(MODULE_NAME_MATCH_REGEX);
            moduleName = result[1];
    
            try {
                this._loadModule(moduleName, moduleFileName, oxModulesDirPath, this.opts);
            } catch (e) {
                console.error(e)
                logger.error('Error initializing module "' + moduleName + '": ' + e.message + EOL + (e.stacktrace ? e.stacktrace : ''));
                // ignore any module that failed to load, except Web and Mob modules
                // without Mob and Web modules loaded, the initialization process shall fail
                if (moduleName === 'web' || moduleName === 'mob') {
                    err = e;
                    break;
                }
            }
        }        
    }

    _loadModule(moduleName, moduleFileName, oxModulesDirPath) {
        let ModuleClass = require(path.join(oxModulesDirPath, moduleFileName));    
        if (ModuleClass.default) {
            ModuleClass = ModuleClass.default;
        }        
        const mod = new ModuleClass(this.opts, this.ctx, this.resultStore, logger, this.services);   
        if (!mod.name) {
            mod.name = moduleName;
        } 
        // load external commands
        const cmdDir = path.join(oxModulesDirPath, 'module-' + moduleName, 'commands');
        if (fs.existsSync(cmdDir)) {
            var commandName = null;
            try {
                const files = fs.readdirSync(cmdDir);
                for (var fileName of files) {
                    commandName = fileName.slice(0, -3);
                    if (commandName.indexOf('.') !== 0) {   // ignore possible hidden files (i.e. starting with '.')
                        var cmdFunc = require(path.join(cmdDir, commandName));
                        // bind function's "this" to module's "this"
                        var fnc = cmdFunc.bind(mod._this || mod);
                        mod[commandName] = fnc;
                        // since commands have access only to _this, reference all
                        // commands on it, so commands could have access to each other.
                        // note that command defined in the main module won't be referenced.
                        mod._this[commandName] = fnc;
                    }
                }
            } catch (e) {
                logger.error("Can't load command '" + commandName + ': ' + e.message);
                logger.debug(e.stack);
            }
        }
    
        // apply this for functions inside 'helpers' methods collection if found
        if (mod.helpers || (mod._this && mod._this.helpers)) {
            const helpers = mod.helpers || mod._this.helpers;
            for (var funcName in helpers) {
                if (typeof helpers[funcName] === 'function') {
                    helpers[funcName] = helpers[funcName].bind(mod._this || mod);
                }
            }
        }
    
        logger.debug('Loading module: ' + moduleName);
        this.modules[moduleName] = global.ox.modules[moduleName] = this._wrapModule(moduleName, mod);
        this._callServicesOnModuleLoaded(mod);
    }

    _wrapModule(name, module) {
        const wrapper = {
            name: name
        };
        const _this = this;        
        let moduleMethods = Object.keys(module);
        if (!moduleMethods.some(x => x=== 'exports')) {
            moduleMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(module));
        }
        for (let methodName of moduleMethods) {
            const method = module[methodName];
            if ((!(method instanceof Function) && typeof method !== 'function') || methodName === 'exports' || methodName === '_compile') continue;
            /*if (typeof module[methodName] !== 'function' || methodName === 'exports') {
                continue;
            }*/
            // FIXME: all methods both public and internal should have identical error and results handling
            if (methodName === 'driver') {
                wrapper[methodName] = module[methodName];
            }
            else if (methodName.indexOf('_') === 0) {
                wrapper[methodName] = function() {
                    var args = Array.prototype.slice.call(arguments);
                        
                    logger.debug('Executing: ' + this._getMethodSignature(name, methodName, args));
    
                    try {
                        return module[methodName].apply(module._this, args);
                    } catch (e) {
                        throw errorHelper.getOxygenError(e, name, methodName, args);
                    }
                };
            }
            else {
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
                }
            }
        }
        return wrapper;
    }    

    _commandWrapper(cmdName, cmdArgs, module, moduleName) {
        let retval = null;
        let error = null;
        const cmdFn = module[cmdName];

        const publicMethod = !cmdName.startsWith('_') && cmdName !== 'dispose';

        // delay the command execution if required
        if (this.opts.delay && publicMethod &&
            cmdName !== 'init' &&
            cmdName !== 'transaction') {
            deasync.sleep(this.opts.delay*1000);
        }

        // throw if a command executed on unitialized module (except internal methods and a few other)
        if (!module._isInitialized && !module.isInitialized && publicMethod && cmdName !== 'init' && cmdName !== 'transaction') {
            throw new OxError(errorHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, 'Missing ' + moduleName + '.init()');
        }

        const startTime = oxutil.getTimeStamp();
        
        // add command location information (e.g. file name and command line)
        let cmdLocation = null;
        // do not report results or line updates on internal methods (started with '_')
        if (publicMethod) {
            cmdLocation = this._getCommandLocation();
            this.emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, startTime);
        }

        logger.debug('Executing: ' + this._getMethodSignature(moduleName, cmdName, cmdArgs));        
        
        try {
            // emit before events
            if (cmdName === 'dispose') {
                this._wrapAsync(this._callServicesOnModuleWillDispose).apply(this, [module]);
                //this._callServicesOnModuleWillDispose(module);
            }            
            retval = this._wrapAsync(module[cmdName]).apply(module._this, cmdArgs);
            //retval = module[cmdName].apply(module._this, cmdArgs);
            if (cmdName === 'init') {
                this._callServicesOnModuleInitialized(module);
            }
            
        } catch (e) {
            // do nothing if error ocurred after the module was disposed (or in a process of being disposed)
            // except for init methods of course
            if (module._this && 
                (typeof module._this.isInitialized === 'boolean' && !module._this.isInitialized) 
                && cmdName !== 'init') {
                return;
            }
            //console.log('==== error ====', e)
            error = errorHelper.getOxygenError(e, moduleName, cmdName, cmdArgs);
            
        }

        const endTime = oxutil.getTimeStamp(); 

        if (publicMethod) {
            const stepResult = this._getStepResult(module, moduleName, cmdName, cmdArgs, startTime, endTime, retval, error);            
            stepResult.location = cmdLocation;
            this.resultStore.steps.push(stepResult);
            this.emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, endTime, stepResult);
        }

        if (error && error.isFatal && !this.opts.continueOnError) {
            throw error;
        }
        return retval;
    }

    _wrapAsync (fn, context) {
        return function (...args) {
          var self = context || this;
          var callback;
      
          for (let i = args.length - 1; i >= 0; --i) {
            const arg = args[i];
            const type = typeof arg;
            if (type !== "undefined") {
              if (type === "function") {
                callback = arg;
              }
              break;
            }
          }      
          // if the current code is not running inside the Fiber context, then run async code as sync using deasync module
          if (!Fiber.current) {
            const retval = fn.apply(self, args);
            let done = false;
            let error = null;
            let finalVal = null;
            Promise.resolve(retval)
                .then((val) => {
                    finalVal = val;
                    done = true;
                })
                .catch((e) => {
                    error = e;
                    done = true;
                });

            deasync.loopWhile(() => !done && !error);

            if (!error) {
                return finalVal;
            }
            throw error;
          }
          // otherwise, if we are inside the Fiber context, then use Fiber's Future
          const future = new Future();
          var result = fn.apply(self, args);
          if (result && typeof result.then === 'function') {
            result.then((val) => future.return(val), (err) => future.throw(err));
            return future.wait();
          }           
          return result;
        };
    };

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
            return `${caller.getFileName()}:${caller.getLineNumber()}:${caller.getColumnNumber()}`
        }
        return null;
    }

    _getStepResult(module, moduleName, methodName, args, startTime, endTime, retval, err) {
        var step = new StepResult();
        // convert method arguments to string
        var methodArgs = '()';
        if (args) {
            var argsStr = JSON.stringify(args);
            methodArgs = '(' + argsStr.slice(1, -1) + ')';
        }
        step.name = this._getMethodSignature(moduleName, methodName, args); // moduleName + '.' + methodName + methodArgs;
        step.transaction = global._lastTransactionName;                    // FIXME: why is this here if it's already populated in rs?
        // determine step status
        if (err) {
            if (err.isFatal) {
                step.status = STATUS.FAILED;
            }
            else {
                step.status = STATUS.WARNING;
            }
        }
        else {
            step.status = STATUS.PASSED;
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
            step.failure = errorHelper.getFailureFromError(err);
            // let the module decide whether a screenshot should be taken on error or not
            if (typeof module._takeScreenshot === 'function') {
                try {
                    step.screenshot = module._takeScreenshot(methodName);
                }
                catch (e) {
                    // If we are here, we were unable to get a screenshot
                    // Try to wait for a moment (in Perfecto Cloud, the screenshot might not be immidiately available)
                    deasync.sleep(1000);
                    try {
                        step.screenshot = module._takeScreenshot(methodName);
                    }
                    catch (e) {
                        // FIXME: indicate to user that an attempt to take a screenshot has failed
                    }
                }
            }
        }
        return step;
    }

    _getMethodSignature(moduleName, methodName, methodArgs) {
        // convert method arguments to string
        let methodArgsStr = '()';
        if (methodArgs) {
            let argsStringified = JSON.stringify(methodArgs);
            methodArgsStr = '(' + argsStringified.slice(1, -1) + ')';
        }
        return moduleName + '.' + methodName + methodArgsStr;
    }

    async _disposeServices() {
        if (!this.services || typeof this.services !== 'object') {
            return false;
        }
        for (let key in this.services) {
            const service = this.services[key];
            if (service.dispose) {
                await service.dispose();
            }
        }
        return true;
    }

    async _disposeModules() {
        if (!this.modules || typeof this.modules !== 'object') {
            return false;
        }
        for (let key in this.modules) {
            const mod = this.modules[key];
            if (mod.dispose) {                
                await mod.dispose();
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
                logger.error(`Failed to call "onModuleLoaded" method of ${serviceName} service.`, e);
            }
        }
    }
    _callServicesOnModuleInitialized(module) {
        for (let serviceName in this.services) {
            const service = this.services[serviceName];
            if (!service) {
                continue;
            }
            try {
                service.onModuleInitialized(module);
            }
            catch (e) {
                logger.error(`Failed to call "onModuleInitialized" method of ${serviceName} service.`, e);
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
                await service.onModuleWillDispose(module);
            }
            catch (e) {
                logger.error(`Failed to call "onModuleWillDispose" method of ${serviceName} service.`, e);
            }
        }
    }
}
