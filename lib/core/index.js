import globule from 'globule';
import path from 'path';
import fs from 'fs';
import deasync from 'deasync';
import { EOL } from 'os';

import StepResult from '../../model/step-result';
import Failure from '../../model/failure';
import OxygenEvents from './events';
import oxutil from '../util';
import OxError from '../../errors/OxygenError';
import errHelper from '../../errors/helper';
import STATUS from '../../model/status.js';

require('@babel/register')({
    // Find babel.config.js up the folder structure.
    //rootMode: 'upward',
  
    // Since babel ignores all files outside the cwd, it does not compile sibling packages
    // So rewrite the ignore list to only include node_modules
    ignore: ['node_modules'],
    //presets: [['@babel/preset-env', {targets: {node: 'current'}, useBuiltIns: 'entry'}]],
    presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
    plugins: ["@babel/plugin-transform-modules-commonjs"]
  });

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
const logger = console;
const DEFAULT_CTX = {
    params: null,
    vars: null,
    env: null,
    caps: null
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
        this.capabilities = null;
        this.opts = null;
    }

    async init(options, caps, ctx = {}, results = {}) {
        this.opts = Object.assign(DEFAULT_OPTS, options)
        this.cwd = this.opts.cwd || process.cwd()
        this.ctx = Object.assign(DEFAULT_CTX, ctx || {})
        this.resultStore = Object.assign(DEFAULT_RESULT_STORE, results || {})
        this.capabilities = caps
        
        global.ox = { 
            modules: this.modules,
            ctx: this.ctx,
            options: this.opts,
            caps: this.capabilities,
            resultStore: this.resultStore
        };
        
        this._loadModules();

        this.isInitialized = true
    }

    async dispose() {
        try {
            //await this._disposeModules();
            this.isInitialized = false;
        }
        catch (e) {
            this.isInitialized = false;
            console.error('Failed to dispose: ', e)
            throw e;    
        }        
    }

    _loadModules() {
        const homeDir = path.join(path.dirname(require.main.filename), '../');
        const oxModulesDirPath = path.resolve(homeDir, './ox_modules');
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
        let ModuleClass;
        try {
            ModuleClass = require(path.join(oxModulesDirPath, moduleFileName));
        } catch (e) {
            if (e instanceof ModuleUnavailableError) {
                //logger.warn('Loading module: ' + moduleName + '. Failed to load - ' + e.message);
                return;
            } else {
                throw e;
            }
        }
    
        const mod = new ModuleClass(this.opts, this.ctx, this.resultStore, logger);
    
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
    }

    _wrapModule(name, module) {
        const wrapper = {};
        const _this = this;
        Object.keys(module).forEach(function (methodName) {
            if (typeof module[methodName] !== 'function' || methodName === 'exports') {
                return;
            }
    
            // FIXME: all methods both public and internal should have identical error and results handling
            if (methodName === 'driver') {
                wrapper[methodName] = module[methodName];
            }
            else if (methodName.indexOf('_') === 0) {
                wrapper[methodName] = function() {
                    var args = Array.prototype.slice.call(arguments);
    
                    logger.debug('Executing: ' + getMethodSignature(name, methodName, args));
    
                    try {
                        return module[methodName].apply(module._this, args);
                    } catch (e) {
                        throw errHelper.getOxygenError(e, name, methodName, args);
                    }
                };
                return;
            }
            else {
                wrapper[methodName] = (...args) => {
                    try {
                        return _this._commandWrapper(methodName, args, module, name);
                    }                    
                    catch (e) {
                        if (e instanceof OxError) {
                            console.log('throwing again')
                            throw e;
                        }
                        throw errHelper.getOxygenError(e, name, methodName, args);
                    }
                }
            }
            
        });
        return wrapper;
    }    

    _commandWrapper(cmdName, cmdArgs, module, moduleName) {
        console.log('_commandWrapper', cmdName)
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
        if (!module._isInitialized() && publicMethod && cmdName !== 'init' && cmdName !== 'transaction') {
            throw new OxError(errHelper.errorCode.MODULE_NOT_INITIALIZED_ERROR, 'Missing ' + cmdName + '.init()');
        }

        let startTime = oxutil.getTimeStamp();

        // do not report results or line updates on internal methods (started with '_')
        let cmdLocation = null;
        if (publicMethod) {
            cmdLocation = this._getCommandLocation();
            this.emitBeforeCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, startTime);
        }

        //logger.debug('Executing: ' + getMethodSignature(name, methodName, args));        
        
        try {
            retval = module[cmdName].apply(module._this, cmdArgs);
        } catch (e) {
            // do nothing if error ocurred after the module was disposed (or in a process of being disposed)
            // except for init methods of course
            if (module._this && 
                (typeof module._this.isInitialized === 'boolean' && !module._this.isInitialized) 
                && cmdName !== 'init') {
                return;
            }
            error = errHelper.getOxygenError(e, moduleName, cmdName, cmdArgs);
            //console.log('==== error ====', error)
        }

        const endTime = oxutil.getTimeStamp(); 

        // report all steps only if autoReport option is true or the step has an error
        if (typeof(this.opts.autoReport) === 'undefined' || this.opts.autoReport == true || error) {
            this._handleStepResult(module, moduleName, cmdName, cmdArgs, startTime, endTime, retval, error);
        }

        if (publicMethod) {
            this.emitAfterCommand(cmdName, moduleName, cmdFn, cmdArgs, this.ctx, cmdLocation, endTime, retval, error || null);
        }

        if (error && error.isFatal && !this.opts.continueOnError) {
            throw error;
        }
        return retval;
    }

    // retrieve current line and function name from the call stack
    _getCommandLocation() {
        const stack = __stack;
        if (stack.length > 1) {
            return {
                uri: stack[1].getFileName(),
                method: stack[1].getFunctionName(),
                line: stack[1].getLineNumber()
            };
        }
        return null;
    }

    _handleStepResult(module, moduleName, methodName, args, startTime, endTime, retval, err) {
        var step = new StepResult();
        // convert method arguments to string
        var methodArgs = '()';
        if (args) {
            var argsStr = JSON.stringify(args);
            methodArgs = '(' + argsStr.slice(1, -1) + ')';
        }
        step._name = moduleName + '.' + methodName + methodArgs;
        step._transaction = global._lastTransactionName;                    // FIXME: why is this here if it's already populated in rs?
        // determine step status
        if (err) {
            if (err.isFatal) {
                step._status = STATUS.FAILED;
            }
            else {
                step._status = STATUS.WARNING;
            }
        }
        else {
            step._status = STATUS.PASSED;
        }
        step._action = (typeof module._isAction === 'function' ? module._isAction(methodName).toString() : 'false');
        step._startTime = startTime;
        step._endTime = endTime;
        step._duration = endTime - startTime;
    
        if (typeof module._getStats === 'function') {
            step.stats = module._getStats(methodName);
        } else {
            step.stats = {};
        }
    
        if (err) {
            step.failure = new Failure();
            step.failure._message = err.message;
            step.failure._type = err.type;
            step.failure._data = err.data;
            // extract line number and column from error object
            if (err.stacktrace) {
                // FIXME
                /*var lineColumn = getLineAndColumnFromStacktrace(err, scriptPath);
                if (lineColumn) {
                    err.line = lineColumn.line;
                    err.column = lineColumn.column;
                }*/
            }
            step.failure._line = err.line;
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
        this.resultStore.steps.push(step);
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
    
}
