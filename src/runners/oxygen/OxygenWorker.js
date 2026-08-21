/*
 * Copyright (C) 2019-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Based on:
 * Copyright (c) OpenJS Foundation and other contributors. Licensed under MIT.
 */

const path = require('path');
const fs = require('fs');
const Module = require('module');
const { EventEmitter } = require('events');
const scriptTransformer = require('../../core/scriptTransformer');

const Oxygen = require('../../core/OxygenCore').default;
const oxutil = require('../../lib/util');
const errorHelper = require('../../errors/helper');

// mockup globbal.browser object for internal WDIO functions to work properly
global.browser = {};

export default class OxygenWorker extends EventEmitter {
    constructor (reporter, logger) {
        super();
        this._oxygen = null;
        this._opts = null;
        this._logger = logger;
        this._testHooks = {};
        this._reporter = reporter;
        this._runId = null;
    }
    /*
     * Initialize Oxygen engine
     */
    async init(runId, options, caps) {
        this._runId = runId;
        this._opts = options;
        this._cwd = this._opts.cwd || process.cwd();

        if (!this._oxygen) {
            try {
                this._oxygen = new Oxygen();
                this._oxygen.on('command:before', this._handleBeforeCommand.bind(this));
                this._oxygen.on('command:after', this._handleAfterCommand.bind(this));
                this._oxygen.on('log', this._handleLogEntry.bind(this));
                await this._oxygen.init(options, caps);
                this._testHooks = oxutil.loadTestHooks(options);
                this._prepareSessionContext(options, caps);
                this._loadSessionPageObjects(options);
                //makeModulesGlobal(options);
                this._logger.debug('Oxygen initialization completed');
            }
            catch (e) {
                this._logger.debug(`Oxygen initialization failed: ${e.toString()}`);
                throw e;
            }
        }
    }
    /*
     * Run individual test case
     */
    async run({ scriptPath, context, poFile = null }) {
        // assign up to date context to Oxygen Core to reflect new parameters and other context data
        if (!this._oxygen) {
            throw Error ('Oxygen is not initialized');
        }
        this._oxygen.context = context;
        this._steps = [];
        if (this._cwd && !path.isAbsolute(scriptPath)) {
            scriptPath = path.resolve(this._cwd, scriptPath);
        }
        let error = null;

        // on OSX cwd will be a symlink: "/var/folders/.." instead of "/private/var/folders/.." (this could also happen on other platforms too)
        // so we need to resolve it to real path
        let cwd = fs.realpathSync(this._cwd);

        // load and run the test script
        try {
            this._oxygen && this._oxygen.onBeforeCase && await this._oxygen.onBeforeCase(context);

            // invalidate require cache for all user scripts so each iteration loads fresh copies
            const originalRequire = Module.prototype.require;
            Module.prototype.require = function() {
                const script = arguments['0'];
                // invalidate cache only when loading user-level scripts (relative paths)
                if (script && script.startsWith('.')) {
                    for (const key in require.cache) {
                        if (key.startsWith && key.startsWith(cwd)) {
                            try {
                                delete require.cache[key];
                            } catch (exi) {
                                // ignored
                            }
                        }
                    }
                }
                return originalRequire.apply(this, arguments);
            };

            // install require hook so sub-scripts required from within the test are also transformed
            scriptTransformer.installRequireHook(cwd);

            // load po file AFTER hook is installed so its functions are async-transformed
            if (poFile) {
                try { delete require.cache[require.resolve(poFile)]; } catch (e) { /* not cached yet */ }
            }
            this._oxygen.loadPageObjectFile(poFile);

            try {
                // read and transform the entry script - wraps it in an async IIFE exported as module.exports
                const scriptCode = fs.readFileSync(scriptPath, 'utf8');
                const transformed = scriptTransformer.transform(scriptCode, scriptPath, true);

                // clear entry script from require cache so it's re-evaluated on each run
                try {
                    delete require.cache[scriptPath];
                } catch (ce) {
                    // ignored
                }

                // execute via Module._compile so the script has full Node module context (module, require, __dirname, etc.)
                const m = new Module(scriptPath, module);
                m.filename = scriptPath;
                m.paths = Module._nodeModulePaths(path.dirname(scriptPath));
                m._compile(transformed, scriptPath);

                // m.exports is the Promise returned by the async IIFE - await it to run the test
                if (m.exports && typeof m.exports.then === 'function') {
                    await m.exports;
                }
            } finally {
                scriptTransformer.uninstallRequireHook();
                Module.prototype.require = originalRequire;
            }
        } catch (e) {
            if (e && e.type && e.type === errorHelper.errorCode.ASSERT_PASSED) {
                // ignore
            } else {
                error = e;
            }
        }

        // In some cases step result generation takes some time to make screenshot
        await this._oxygen._waitStepResult();

        if (error) {
            error = errorHelper.getFailureFromError(error);
        }

        let moduleCaps = {};

        if (this._oxygen && this._oxygen.getModulesCapabilities) {
            moduleCaps = this._oxygen.getModulesCapabilities();
        }

        this._oxygen && this._oxygen.onAfterCase && await this._oxygen.onAfterCase(error);

        // clone the results, otherwise resultStore will be empty after the following this._oxygen.resetResults() call

        let resultStore = {};

        if (this._oxygen && this._oxygen.results) {
            resultStore = { ...this._oxygen.results };
        }

        if (this._oxygen && this._oxygen.resetResults) {
            // reset steps and other result data
            this._oxygen.resetResults();
        }
        this._steps = null;

        let oxContext = {};
        if (this._oxygen && this._oxygen.context) {
            oxContext = this._oxygen.context;
        }
        oxContext.vars = global.vars;

        return { error, moduleCaps, resultStore, context: oxContext };
    }
    /*
     * Dispose Oxygen engine
     */
    async dispose(status = null) {
        if (this._oxygen) {
            try {
                await this._oxygen.dispose(status);
            }
            catch (e) {
                this._logger.error('Failed to dispose Oxygen', null, e);
            }
            finally {
                this._steps = null;
            }
        }
    }
    async startSession() {

    }

    async endSession(status = null, disposeModules = true) {
        if (this._oxygen) {
            try {
                if (disposeModules) {
                    await this._oxygen.disposeModules(status);
                }
            }
            catch (e) {
                this._logger.error('Failed to dispose Oxygen modules', null, e);
            }
            finally {
                this._oxygen.resetResults();
            }
        }
    }

    async callTestHook(hookName, hookArgs) {
        if (!this._testHooks || !this._testHooks[hookName] || typeof this._testHooks[hookName] !== 'function') {
            throw new Error(`Hook does not exist: ${hookName}`);
        }
        await oxutil.executeTestHook(this._testHooks, hookName, hookArgs);
    }

    async replStart() {
        let commandResolve = () => { };

        setTimeout(async() => {
            if (this._oxygen && this._oxygen.modules) {
                const keys = Object.keys(this._oxygen.modules);
                let debug;
                keys.map((item) => {
                    const driver = this._oxygen.modules[item]['getDriver'] && this._oxygen.modules[item]['getDriver']();
                    if (driver) {
                        debug = this._oxygen.modules[item]['debug'];
                    }
                });

                if (debug) {
                    await debug();
                    commandResolve();
                } else {
                    commandResolve();
                }
            } else {
                commandResolve();
            }
        }, 10);

        return new Promise((resolve) => (commandResolve = resolve));
    }

    /*
     * Give an interactive session the same context a test case gets.
     *
     * A run assigns this per case, in run(); a session never runs one, so `env` and
     * `params` were simply absent - and a page object that opens env.url, which is how
     * essentially every project starts, failed on an undefined URL. Setting it here is
     * what makes `oxygen po Login ...` take the same path the test takes.
     */
    _prepareSessionContext(options, caps) {
        this._oxygen.context = {
            params: {},
            env: (options && options.env) || {},
            caps: caps || {},
            vars: {},
            attributes: {},
            test: { case: { name: 'session', iteration: 1 }, suite: { name: 'session', iteration: 1 } },
        };
    }

    /*
     * Make the project's page objects available to an interactive session.
     *
     * A test run loads this file per case, inside run(); a session never runs a case, so
     * without this `po` exists only in scripts and a walkthrough of a real project has to
     * retype by hand what po.Login() already does. The require hook has to be installed
     * around the load for the same reason it is in run(): the file's functions call web
     * commands and must come out async-transformed, or every command inside them returns a
     * pending Promise instead of a value.
     */
    _loadSessionPageObjects(options) {
        if (!options || !options.po) {
            return;
        }
        try {
            scriptTransformer.installRequireHook(this._cwd);
            try { delete require.cache[require.resolve(options.po)]; } catch (e) { /* not cached yet */ }
            this._oxygen.loadPageObjectFile(options.po);
        }
        catch (e) {
            // A page object file that will not load must not stop the session from
            // starting - every web command still works, and the error is worth seeing
            // when `po` is actually used rather than at startup.
            this._poLoadError = e.message;
        }
        finally {
            scriptTransformer.uninstallRequireHook();
        }
    }

    /*
     * Resolve the reference markers an interactive caller can pass instead of a literal.
     *
     * `secret:` is the reason this exists. utils.decrypt returns a DecryptResult rather
     * than a string, and Oxygen Core knows to unwrap it for the call while printing
     * ENCRYPTED in the step. Resolving here keeps that intact: the plaintext is created
     * inside the worker, used, and never travels back over the socket or into a step name.
     */
    _resolveArguments(args) {
        return args.map((arg) => {
            if (!arg || typeof arg !== 'object' || typeof arg.$oxRef !== 'string') {
                return arg;
            }
            switch (arg.$oxRef) {
                case 'po':
                    return this._readPath(this._repository(), arg.path, 'po');
                case 'secret': {
                    const value = this._readPath(this._repository(), arg.path, 'secret');
                    return oxutil.decrypt(value);
                }
                case 'env': {
                    const env = (this._opts && this._opts.env) || {};
                    return this._readPath(env, arg.path, 'env');
                }
                default:
                    throw new Error(`Unknown reference type: "${arg.$oxRef}"`);
            }
        });
    }

    _repository() {
        const repository = this._oxygen && this._oxygen.repository;
        if (!repository) {
            throw new Error(this._poLoadError
                ? `The page object file failed to load: ${this._poLoadError}`
                : 'This project has no page object file (oxygen.po.js), so there is nothing for "po:" to read.');
        }
        return repository;
    }

    _readPath(root, dottedPath, kind) {
        const parts = String(dottedPath).split('.');
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            if (current === null || current === undefined) {
                const sofar = parts.slice(0, i).join('.');
                throw new Error(`${kind}:${dottedPath} does not exist - "${sofar}" is not an object.`);
            }
            current = current[parts[i]];
        }
        if (current === undefined) {
            const available = root && typeof root === 'object' ? Object.keys(root).sort().join(', ') : '';
            throw new Error(
                `${kind}:${dottedPath} does not exist.` + (available ? ` Available at the top level: ${available}` : '')
            );
        }
        return current;
    }

    /*
     * Invoke a single module command against the live session and return its result.
     *
     * This is the entry point used by the interactive session host (the `oxygen web click ...`
     * CLI verbs and the MCP tools). It deliberately mirrors what a test script does when it
     * calls `web.click(...)`: the command goes through Oxygen Core's regular command wrapper,
     * so parameter substitution, step-result generation, screenshots and events all behave
     * exactly as they do inside a normal run.
     *
     * Unlike run(), it does not throw on command failure - the failure is returned as part of
     * the result so an interactive caller can decide what to do next.
     */
    async invokeCommand({ module: moduleName, command, args = [] }) {
        if (!this._oxygen) {
            throw new Error('Oxygen is not initialized');
        }
        const resolvedArgs = this._resolveArguments(args);

        // `po` is not one of Oxygen's modules - it is the project's own page object file -
        // so it is dispatched separately. Its entries nest, hence a dotted command name:
        // `oxygen po Checkout.addToCart` calls po.Checkout.addToCart().
        if (moduleName === 'po') {
            return await this._invokePageObject(command, resolvedArgs);
        }

        const mod = this._oxygen.modules[moduleName];
        if (!mod) {
            const available = Object.keys(this._oxygen.modules).sort().join(', ');
            throw new Error(`Unknown module: "${moduleName}". Available modules: ${available}`);
        }
        if (typeof mod[command] !== 'function') {
            throw new Error(`Unknown command: "${moduleName}.${command}"`);
        }

        // steps produced by this command are whatever Oxygen Core appends from here on
        const stepsBefore = this._oxygen.resultStore.steps.length;

        let retval = undefined;
        let error = null;
        try {
            retval = await mod[command].apply(mod, resolvedArgs);
        }
        catch (e) {
            if (e && e.type && e.type === errorHelper.errorCode.ASSERT_PASSED) {
                // not a failure - `assert.pass()` signals success by throwing
            }
            else {
                error = errorHelper.getFailureFromError(e);
                if (error) {
                    error.location = userLocation(error.location);
                    error.stacktrace = userStacktrace(error.stacktrace);
                }
            }
        }

        // Oxygen Core pushes the step result before the command returns, so no wait is needed here.
        const steps = this._oxygen.resultStore.steps
            .slice(stepsBefore)
            .map((step) => summarizeStep(step));

        return { retval: serializableRetval(retval), error, steps };
    }

    /*
     * Call a function on the project's page object repository, or read a value from it.
     *
     * The commands a page object function issues go through Oxygen Core exactly as they do
     * in a test, so the steps it produces are collected the same way - which is what makes
     * `oxygen po Login ...` a walkthrough of the same path the test takes rather than an
     * approximation of it.
     */
    async _invokePageObject(commandPath, args) {
        const repository = this._repository();
        // no command names the repository itself - answer with what it holds, which is the
        // only way to discover it: page objects are the project's, not Oxygen's, so the
        // generated catalogue knows nothing about them
        if (!commandPath) {
            return { retval: describeRepository(repository), error: null, steps: [] };
        }
        const target = this._readPath(repository, commandPath, 'po');

        if (typeof target !== 'function') {
            // reading a value is legitimate - `oxygen po GeneralCust.custNo1` answers
            // "what will the test actually type here?" without running anything
            return { retval: serializableRetval(target), error: null, steps: [] };
        }

        const stepsBefore = this._oxygen.resultStore.steps.length;
        let retval = undefined;
        let error = null;
        try {
            retval = await target.apply(repository, args);
        }
        catch (e) {
            if (e && e.type && e.type === errorHelper.errorCode.ASSERT_PASSED) {
                // not a failure - `assert.pass()` signals success by throwing
            }
            else {
                error = errorHelper.getFailureFromError(e);
                if (error) {
                    error.location = userLocation(error.location);
                    error.stacktrace = userStacktrace(error.stacktrace);
                }
            }
        }

        const steps = this._oxygen.resultStore.steps
            .slice(stepsBefore)
            .map((step) => summarizeStep(step));

        return { retval: serializableRetval(retval), error, steps };
    }

    /*
     * Report which modules are loaded and which of them currently hold a live session.
     */
    async getSessionState() {
        if (!this._oxygen) {
            throw new Error('Oxygen is not initialized');
        }
        const modules = {};
        for (const name of Object.keys(this._oxygen.modules)) {
            const mod = this._oxygen.modules[name];
            let initialized = false;
            try {
                initialized = !!(mod.getDriver && mod.getDriver());
            }
            catch (e) {
                initialized = false;
            }
            modules[name] = { initialized };
        }
        return { modules, stepCount: this._oxygen.resultStore.steps.length };
    }

    /*
     * Full step log for the session, used to emit a test script from an interactive walkthrough.
     */
    async getStepLog() {
        if (!this._oxygen) {
            throw new Error('Oxygen is not initialized');
        }
        return this._oxygen.resultStore.steps.map((step) => summarizeStep(step));
    }

    _handleBeforeCommand(e) {
        if (!e) {
            return;
        }
        this.emit('command:before', e);
    }

    _handleAfterCommand(e) {
        if (!e || !e.result) {
            return;
        }

        this._steps && this._steps.push(e.result);
        this.emit('command:after', e);
    }

    _handleLogEntry(e) {
        if (!e || !e.level || !e.message) {
            return;
        }
        if (e && e.level && e.level === 'error') {
            this._logger[e.level](e.message, e.src, e.err);
        } else {
            this._logger[e.level](e.message, e.src);
        }
    }
}

/*
 * Reduce a StepResult to something worth sending over IPC to an interactive client.
 * Screenshots and page snapshots are deliberately dropped - they are large enough to
 * dominate the payload, and an interactive caller asks for them explicitly instead.
 */
/*
 * A listing of what a project's page object file exposes: functions with the arguments
 * they declare, and plain values with a short preview.
 */
function describeRepository(repository, prefix = '') {
    const entries = [];
    for (const key of Object.keys(repository).sort()) {
        const value = repository[key];
        const name = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'function') {
            entries.push({ name, kind: 'function', arity: value.length });
        }
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            entries.push(...describeRepository(value, name));
        }
        else {
            entries.push({ name, kind: 'value', type: typeof value });
        }
    }
    return entries;
}

function summarizeStep(step) {
    if (!step) {
        return step;
    }
    const failure = step.failure ? {
        ...step.failure,
        location: userLocation(step.failure.location),
        stacktrace: userStacktrace(step.failure.stacktrace),
    } : null;
    return {
        name: step.name,
        status: step.status,
        duration: step.duration,
        transaction: step.transaction,
        location: userLocation(step.location),
        failure,
        hasScreenshot: !!step.screenshot,
    };
}

// Oxygen records the call site of every command. During a normal run that is a line in
// the user's test script, which is exactly what a reader wants. A command invoked
// interactively has no script behind it, so the recorded location points into Oxygen's
// own source - reporting that would send a reader chasing framework internals.
//
// __dirname is build/runners/oxygen, so three levels up reaches the package root. It has
// to be the package root rather than build/, because source-map-support rewrites these
// paths back to src/ and an anchor inside build/ would never match them.
const OXYGEN_ROOT = path.normalize(path.join(__dirname, '..', '..', '..')) + path.sep;
function userLocation(location) {
    if (!location || typeof location !== 'string') {
        return null;
    }
    return path.normalize(location).startsWith(OXYGEN_ROOT) ? null : location;
}

// Every frame of an interactive failure's stack trace is inside Oxygen, so the whole
// trace is noise. Keep only frames that belong to the caller's own code, if any.
function userStacktrace(stacktrace) {
    if (!Array.isArray(stacktrace)) {
        return undefined;
    }
    const frames = stacktrace.filter((frame) => userLocation(frame));
    return frames.length ? frames : undefined;
}

/*
 * Command return values cross a process boundary as JSON. WebdriverIO Element objects
 * (returned by findElement and friends) carry a live driver reference and cannot be
 * serialized, so they are reduced to an identifying description instead.
 */
function serializableRetval(retval) {
    if (retval === undefined || retval === null) {
        return retval;
    }
    if (typeof retval === 'object' && (retval.elementId || retval.ELEMENT)) {
        return { element: retval.elementId || retval.ELEMENT, selector: retval.selector };
    }
    if (Array.isArray(retval)) {
        return retval.map((item) => serializableRetval(item));
    }
    try {
        JSON.stringify(retval);
        return retval;
    }
    catch (e) {
        return String(retval);
    }
}
