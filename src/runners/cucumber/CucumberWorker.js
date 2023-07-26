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

// eslint-disable-next-line no-global-assign
require = require('esm')(module);
var td = require('testdouble');

import * as Cucumber from 'cucumber';
import isGlob from 'is-glob';
import glob from 'glob';
import { EventEmitter } from 'events';
import CucumberEventListener from './CucumberEventListener';
import CucumberReporter from './CucumberReporter';
import Oxygen from '../../core/OxygenCore';
import oxutil from '../../lib/util';
import Status from '../../model/status';

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

// mockup globbal.browser object for internal WDIO functions to work properly
global.browser = {};

export default class CucumberWorker {
    constructor (reporter) {
        this.rid = null;
        this.isInitialized = false;
        this.reporter = reporter;
        this.cucumberEventListener = null;
        this.cucumberReporter = null;
        this.oxygen = null;
        this.beforeCommandHandler = this.beforeCommandHandler.bind(this);
        this.afterCommandHandler = this.afterCommandHandler.bind(this);
        this.onBeforeFeature = this.onBeforeFeature.bind(this);
        this.onAfterFeature = this.onAfterFeature.bind(this);
        this.onTestEnd = this.onTestEnd.bind(this);
    }

    async init(rid, config, caps) {
        this.rid = rid;
        this.config = config;
        this.cwd = this.config.cwd || process.cwd();
        this.specs = this.resolveSpecFiles(config.specs || []); // config.specs || [];
        this.cucumberOpts = Object.assign(DEFAULT_OPTS, config.cucumberOpts);
        this.testHooks = oxutil.loadTestHooks(config);
        this.capabilities = caps;
        await this.initializeOxygenCore();
        this.isInitialized = true;
    }

    async dispose(status = null) {
        this.isInitialized = false;
        if (this.oxygen) {
            try {
                await this.oxygen.dispose(status);
            }
            catch (e) {
                this._logger.error('Failed to dispose Oxygen', null, e);
            }
            finally {
                this.oxygen = null;
            }
        }
    }

    async _runFnInFiberContext (fn, args) {
        return new Promise((resolve, reject) => (async () => {
            try {
                const result = await fn.apply(this, args || []);
                return resolve(result);
            } catch (err) {
                return reject(err);
            }
        })());
    }

    async run ({ scriptPath, context, poFile = null }) {
        Cucumber.supportCodeLibraryBuilder.reset(this.cwd);

        if (context && this.oxygen) {
            this.oxygen.context = context;
            this.oxygen.loadPageObjectFile(poFile);
        } else {
            if (!this.oxygen) {
                console.warn('this.oxygen is undefined');
            } else {
                console.warn('context in runOpts is undefined');
            }
        }

        this.registerCompilers();
        this.loadRequireFiles();
        this.wrapSteps();
        Cucumber.setDefaultTimeout(this.cucumberOpts.timeout);
        const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize();
        const eventBroadcaster = new EventEmitter();
        this.hookInCucumberEvents(eventBroadcaster);
        this.cucumberReporter = new CucumberReporter(this.rid, this.config, this.cucumberEventListener, this.oxygen, this.reporter, this.testHooks);
        const pickleFilter = new Cucumber.PickleFilter({
            featurePaths: this.specs,
            names: this.cucumberOpts.name,
            tagExpression: this.cucumberOpts.tagExpression
        });
        const testCases = await Cucumber.getTestCasesFromFilesystem({
            cwd: this.cwd,
            eventBroadcaster,
            featurePaths: this.specs.map(spec => spec.replace(/(:\d+)*$/g, '')),
            order: this.cucumberOpts.order,
            pickleFilter
        });
        const runtime = new Cucumber.Runtime({
            eventBroadcaster,
            options: this.cucumberOpts,
            supportCodeLibrary,
            testCases
        });

        // call 'beforeTest' hook
        let hookError = await this._runFnInFiberContext(this.testHooks['beforeTest'], [this.rid, this.config, this.capabilities]);

        if (hookError) {
            throw hookError;
        }
        // run the test
        let error = null;
        try {
            await runtime.start();
        }
        catch (e) {
            error = e;
        }
        // call 'afterTest' hook

        let testResultStatus = Status.PASSED;

        if (this.cucumberReporter && this.cucumberReporter.suites && Object.keys(this.cucumberReporter.suites)) {
            const suites = this.cucumberReporter.suites;
            Object.keys(suites).forEach(function (key) {
                const suite = suites[key];
                if (suite.status === Status.FAILED) {
                    testResultStatus = Status.FAILED;
                }
            });
        }

        this.cucumberReporter.status = testResultStatus;
        hookError = await this._runFnInFiberContext(this.testHooks['afterTest'], [this.rid, this.cucumberReporter, error]);
        if (hookError) {
            throw hookError;
        }
        return testResultStatus;

    }

    async initializeOxygenCore() {
        if (!this.oxygen) {
            this.oxygen = new Oxygen();
            await this.oxygen.init(this.config, this.capabilities);
        }
    }

    async disposeOxygenCore(status = null) {
        if (this.oxygen) {
            try {
                await this.oxygen.dispose(status);
            }
            catch (e) {
                console.error('Failed to dispose Oxygen modules:', e);
            }
            this.oxygen = null;
        }
    }

    registerCompilers () {
        this.cucumberOpts.compiler.forEach(compiler => {
            if (compiler instanceof Array) {
                let parts = compiler[0].split(':');
                require(parts[1])(compiler[1]);
            } else {
                let parts = compiler.split(':');
                require(parts[1]);
            }
        });
    }

    requiredFiles () {
        return this.cucumberOpts.require.reduce((files, requiredFile) => {
            const absolutePath = oxutil.resolvePath(requiredFile, this.cwd);
            if (isGlob(absolutePath)) {
                return files.concat(glob.sync(absolutePath));
            } else {
                return files.concat([absolutePath]);
            }
        }, []);
    }

    loadRequireFiles () {
        // we use testdouble (mockery conflicts with esm here) to allow people to import 'our'
        // cucumber even though their spec files are in their folders
        // because of that we don't have to attach anything to the global object, and the current cucumber spec files
        // should just work with no changes with this framework
        td.replace('cucumber', Cucumber);

        this.requiredFiles().forEach((codePath) => {
            // This allows rerunning a stepDefinitions file
            delete require.cache[require.resolve(codePath)];
            require(codePath);
        });
    }

    resolveSpecFiles (specs) {
        if (!Array.isArray(specs)) {
            return [];
        }
        return specs.reduce((files, specFile) => {
            const absolutePath = oxutil.resolvePath(specFile, this.cwd);
            if (isGlob(absolutePath)) {
                return files.concat(glob.sync(absolutePath));
            }
            else {
                return files.concat(absolutePath);
            }
        }, []);
    }

    beforeCommandHandler() {
        if (this.config.beforeCommand && typeof this.config.beforeCommand === 'function') {
            this.config.beforeCommand();
        }
    }

    afterCommandHandler() {
        if (this.config.afterCommand && typeof this.config.afterCommand === 'function') {
            this.config.afterCommand();
        }
    }
    /**
     * wraps step definition code with sync/async runner with a retry option
     * @param {object} config
     */
    wrapSteps () {
        const wrapStep = this.wrapStep.bind(this);
        const config = this.config;
        const id = this.id;

        Cucumber.setDefinitionFunctionWrapper((fn, options = {}) => {
            /**
             * hooks defined in wdio.conf are already wrapped
             */
            if (fn.name.startsWith('wdioHook')) {
                return fn;
            }

            /**
             * this flag is used to:
             * - avoid hook retry
             * - avoid wrap hooks with beforeStep and afterStep
             */
            const isStep = !fn.name.startsWith('userHook');

            const retryTest = isStep && isFinite(options.retry) ? parseInt(options.retry, 10) : 0;
            return wrapStep(fn, retryTest, isStep, config, id);
        });
    }

    /**
     * wrap step definition to enable retry ability
     * @param   {Function}  code        step definitoon
     * @param   {Number}    retryTest   amount of allowed repeats is case of a failure
     * @param   {boolean}   isStep
     * @param   {object}    config
     * @param   {string}    cid         cid
     * @return  {Function}              wrapped step definiton for sync WebdriverIO code
     */
    wrapStep (code, retryTest = 0, isStep, config, id) {
        const wrapWithHooks = this.wrapWithHooks.bind(this);
        return function (...args) {
            return executeSync.call(this, wrapWithHooks(code), retryTest, args);
        };
    }

    wrapWithHooks (code) {
        const userFn = async function (...args) {
            // step
            let result;
            let error;
            try {
                result = await runFnInFiberContext(code.bind(this, ...args));
            } catch (err) {
                error = err;
            }

            if (error) {
                throw error;
            }
            return result;
        };
        return userFn;
    }

    hookInCucumberEvents(eventBroadcaster) {
        this.cucumberEventListener = new CucumberEventListener(eventBroadcaster);
        /*
        this.cucumberEventListener.on('feature:before', this.onBeforeFeature);
        this.cucumberEventListener.on('feature:after', this.onAfterFeature);
        this.cucumberEventListener.on('scenario:before', this.onAfterFeature);
        this.cucumberEventListener.on('scenario:after', this.onAfterFeature);
        this.cucumberEventListener.on('step:before', this.onAfterFeature);
        this.cucumberEventListener.on('step:after', this.onAfterFeature);
        this.cucumberEventListener.on('test:end', this.onTestEnd);
        */
    }

    onBeforeFeature() {
        //console.log('onBeforeFeature', arguments)
    }

    onAfterFeature() {
        //console.log('onAfterFeature', arguments)
    }

    onTestEnd() {
        //console.log('onTestEnd', arguments)
    }
}

const STACK_START = /^\s+at /;
const STACKTRACE_FILTER = [
    // exclude webdriverio and webdriver stack traces
    'node_modules/webdriverio/build/',
    'node_modules/webdriver/build/',
    // exclude request
    'node_modules/request/request',
    // exclude EventEmitter
    ' (events.js:',
    ' (domain.js:',
    // other excludes
    '(internal/process/next_tick.js',
    'new Promise (<anonymous>)',
    'Generator.next (<anonymous>)',
    '__awaiter ('
];

/**
 * filter stack array
 * @param {string} stackRow
 * @returns {boolean}
 */
const stackTraceFilter = (stackRow) => {
    if (stackRow.match(STACK_START)) {
        return !STACKTRACE_FILTER.some(r => stackRow.includes(r));
    }
    return true;
};

/**
 * execute test or hook synchronously
 *
 * @param  {Function} fn         spec or hook method
 * @param  {Number}   retries    { limit: number, attempts: number }
 * @param  {Array}    args       arguments passed to hook
 * @return {Promise}             that gets resolved once test/hook is done or was retried enough
 */
const defaultRetries = { attempts: 0, limit: 0 };
async function executeSync(fn, retries = defaultRetries, args = []) {
    /**
     * synchronously in standalone mode. In this case we neither have
     * `global.browser` nor `this`
     */
    if (global.browser) {
        delete global.browser._NOT_FIBER;
    }
    if (this) {
        this.wdioRetries = retries.attempts;
    }
    try {
        let res = await fn.apply(this, args);
        /**
         * sometimes function result is Promise,
         * we need to await result before proceeding
         */
        return res;
    }
    catch (e) {
        if (retries.limit > retries.attempts) {
            retries.attempts++;
            return await executeSync.call(this, fn, retries, args);
        }
        /**
         * no need to modify stack if no stack available
         */
        if (!e.stack) {
            return Promise.reject(e);
        }
        e.stack = e.stack.split('\n').filter(stackTraceFilter).join('\n');
        return Promise.reject(e);
    }
}

const runFnInFiberContext = (fn) => {
    return fn.apply(this);
};
