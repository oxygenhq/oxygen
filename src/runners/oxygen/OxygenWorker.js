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

// eslint-disable-next-line no-global-assign
require = require('esm')(module);

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
        this._oxygen.loadPageObjectFile(poFile);
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
