/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
const originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../../', 'config');
const config = require('config');
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;
// setup logger
const loggerFactory = require('oxygen-logger');
loggerFactory.init(config.get('logger'));
const logger = loggerFactory.get('oxygen');
const DEFAULT_ISSUER = 'user';

import { EventEmitter } from 'events';
import _  from 'lodash';
import { defer } from 'when';

import TestSuiteResult from '../../model/suite-result';
import TestCaseResult from '../../model/case-result';
import TestResult from '../../model/test-result';
import Status from '../../model/status';
import oxutil from '../../lib/util';
import errorHelper from '../../errors/helper';
import ParameterManager from '../../lib/param-manager.js';
import WorkerProcess from './WorkerProcess';

export default class OxygenRunner extends EventEmitter {
    constructor() {
        super();
        // class variables
        this._id = oxutil.generateUniqueId();
        this._isRunning = false;
        this._isInitializing = false;
        this._isDisposing = false;
        this._worker = null;
        this._debugMode = false;
        this._workerProcLastError = null;
        // define variables to iterate through test cases and test suite iterations
        this._suite;
        this._envVars = {};  // environment variables passed at the beginning of the test
        this._vars = {};     // user-defined variables that are shared between different scripts
        this._caps = {}; // desired capabilities that are passed to each module
        this._options = null;
        this._localTime = false;
        this._testKilled = false;
        this._scriptContentLineOffset = 3;
        // promises
        this._whenEngineInitFinished = defer();
        this._whenDisposed = defer();
        this._whenTestCaseFinished = null;
    }
    /*********************************
     * Public methods
     *********************************/
    async init(options, caps, reporter) {
        this._options = options;
        this._cwd = this._options.cwd || process.cwd();
        this._capabilities = caps;
        this._reporter = reporter;
        this._isInitialized = true;

        this._env = _.clone(options.envVars) || {};   // assign environment variables for later use
        this._caps = _.clone(options.caps) || {}; // assign caps for later use
        this._suites = _.clone(options.suites) || { cases: [] };
        // make sure at least one test suite is defined
        if (!options.suites) {
            throw new Error('Initialization failed - no test suites are defined. You must define "suites" property in Oxygen options.');
        }
        // set up debugging options
        // TODO: this needs to be reimplemented. Everything related to debugging (initializeDebugger) should be removed from Oxygen
        // and added to IDE instead. I.e. the only thing oxygen should do is to launch the child process with the debugging switch.
        this._debugMode =  options.debugPortIde ? true : false;
        this._debugPort = options.debugPort || options.debugPortIde || null;
        options.scriptContentLineOffset = this._scriptContentLineOffset;
        this._localTime = (this._options && this._options.localTime) || this._localTime;
        await this._startWorkerProcess();
        await this._worker_InitEngine();
    }

    async dispose() {
        this._isDisposing = true;
        try {
            if (!this._testKilled) {
                await this._worker_DisposeEngine();
            }
        }
        catch (e) {
            // ignore errors during the dispose
        }
    }

    async run() {
        if (this._isInitializing) {
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        }
        if (this._isRunning) {
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        }
        this._isRunning = true;

        this._reporter.onRunnerStart(this._id, this._options, this._capabilities);

        let error = null;
        let result = null;
        try {
            result = await this._runTest();
        }
        catch (e) {
            error = e;
        }

        this._reporter.onRunnerEnd(this._id, error);

        this._isRunning = false;

        if (error) {
            throw error;
        }
        return result;
    }

    kill() {
        this._testKilled = true;
        if (this._worker) {
            this._worker.stop();
        }
    }

    debugContinue() {
        if (this.debugMode && this._worker) {
            this._worker.debugger.continue();
        }
    }

    setBreakpoint(line) {
        /*
        if (this.debugMode && this._worker && this._worker.debugger && this._suite && this._suite.testcases) {
            const tc = this._suite.testcases[tcindex];
            logger.debug('oxygen.setBreakpoint: ' + (line + this._scriptContentLineOffset));
            this._worker.debugger.setBreakpoint(tc.name, line + this._scriptContentLineOffset);
        }*/
    }

    clearBreakpoint(line) {
        /*
        if (this.debugMode && this._worker && this._worker.debugger) {
            this._worker.debugger.clearBreakpoint(line + this._scriptContentLineOffset, null);
        }*/
    }

    /*********************************
     * Private methods
     *********************************/

    async _runTest() {
        const result = new TestResult();
        result.startTime = oxutil.getTimeStamp();
        result.status = Status.PASSED;
        result.suites = [];
        let error = null;
        try {
            // iterate through suites
            for (let suite of this._suites) {
                const suiteResult = await this._runSuite(suite);
                result.suites.push(suiteResult);
            }
        }
        catch (e) {
            error = e;
        }
        result.endTime = oxutil.getTimeStamp();
        result.duration = result.endTime - result.startTime;
        const hasFailedSuites = result.suites.some(x => x.status === Status.FAILED);
        result.status = hasFailedSuites ? Status.FAILED : Status.PASSED;
        result.environment = this._env;
        result.capabilities = JSON.parse(JSON.stringify(this._caps));    // assign a copy of _caps object
        result.options = JSON.parse(JSON.stringify(this._options));  // assign a copy of _options object

        // if error occured, add it to the summary
        if (error) {
            result.failure = errorHelper.getFailureFromError(error);
            result.status = Status.FAILED;
        }
        return result;
    }

    async _runSuite(suite) {
        if (!suite) {
            console.log('suite is null!!!');
        }
        // ignore suite with missing mandatory properties
        if (!suite.name && !suite.path) {
            return [];
        }
        // make sure to always specify suite.iterationCount
        if (!suite.iterationCount) {
            suite.iterationCount = 1;
        }
        // single suite might produce multiple results, based on amount of defined iterations
        const suiteIterations = [];
        for (let suiteIteration=1; suiteIteration <= suite.iterationCount; suiteIteration++) {
            const suiteResult = new TestSuiteResult();
            suiteIterations.push(suiteResult);
            suiteResult.name = suite.name || oxutil.getFileNameWithoutExt(suite.path);
            suiteResult.startTime = oxutil.getTimeStamp();
            suiteResult.iterationNum = suiteIteration;
            suiteResult.status = Status.PASSED;
            this._reporter.onSuiteStart(this._id, suite.uri, suiteResult);
            for (let caze of suite.cases) {
                // ignore cases with missing mandatory 'path' property 
                if (!caze.path) {
                    continue;
                }
                if (!caze.name) {
                    caze.name = oxutil.getFileNameWithoutExt(caze.path);
                }
                if (!caze.iterationCount) {
                    caze.iterationCount = 1;
                }
                for (let caseIteration=1; caseIteration <= caze.iterationCount; caseIteration++) {
                    const caseResult = await this._runCase(suite, caze, suiteIteration, caseIteration);
                    if (!caseResult) {
                        continue;
                    }
                    suiteResult.cases.push(caseResult);
                    // if test case iteration has failed, then mark the entire test case as failed, 
                    // stop iterating over it and move to the next test case
                    if (caseResult.status === Status.FAILED) {
                        suiteResult.status = Status.FAILED;
                        break;
                    }
                }
            }
            suiteResult.endTime = oxutil.getTimeStamp();
            suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
            this._reporter.onSuiteEnd(this._id, suite.uri, suiteResult);
        }
        return suiteIterations;
    }

    async _runCase(suite, caze, suiteIteration, caseIteration) {
        const params = {};
        // get test suite's parameters if defined
        // get them first and then override with test case level parameters if defined
        if (suite.paramManager) {
            _.extend(params, suite.paramManager.getValues());
            suite.paramManager.readNext();
        }
        // read test case's next lines of parameters if parameter manager is defined
        if (caze.paramManager) {
            _.extend(params, caze.paramManager.getValues());
            caze.paramManager.readNext();
        }

        // add breakpoints before running the script if in debug mode
        if (this._debugMode && this._worker && this._worker.debugger && caze.breakpoints) {
            for (let i=0; i< caze.breakpoints.length; i++) {
                // editor index starts from 1, but we need zero based index
                let line = caze.breakpoints[i].line;
                let file = caze.breakpoints[i].file;
                // if test case's script file is the same as the file with breakpoint, add extra boilerplate's wrapper lines
                if (caze.path === file) {
                    line = this._scriptContentLineOffset + line;
                }
                await this._worker.debugger.setBreakpoint(file, line);
            }
        }
        //this.emit('iteration:start', caseIteration);
        this._reporter.onCaseStart(this._id, suite.uri || suite.id, caze.uri || caze.id || caze.path, caze);
        let result = null;
        try {
            const caseResult = new TestCaseResult();
            caseResult.name = caze.name;
            caseResult.location = caze.path;
            caseResult.startTime = oxutil.getTimeStamp();
            const { resultStore, context, error } = await this._worker_Run(suite, caze, suiteIteration, caseIteration, params);
            caseResult.endTime = oxutil.getTimeStamp();
            caseResult.duration = caseResult.endTime - caseResult.startTime;
            caseResult.context = context;
            caseResult.steps = resultStore.steps;
            caseResult.logs = resultStore.logs;
            caseResult.har = resultStore.har;

            // determine test case iteration status - mark it as failed if any step has failed
            var failedSteps = _.find(resultStore.steps, {status: Status.FAILED});
            caseResult.status = _.isEmpty(failedSteps) && !error ? Status.PASSED : Status.FAILED;
            if (error) {
                caseResult.failure = error;
                caseResult.status = Status.FAILED;
            }
            result = caseResult;
        } finally {
            this._reporter.onCaseEnd(this._id, suite.uri || suite.id, caze.uri || caze.id, result);
        }
        return result;
    }
    
    async _worker_Run(suite, caze, suiteIteration, caseIteration, params) {
        // define a promise
        this._whenTestCaseFinished = defer();
        // send the message to the worker process
        this._worker.send({
            type: 'run',
            scriptName: caze.name,
            scriptPath: caze.path,
            context: {
                params: params,
                env: this._env,
                caps: this._caps,
                vars: this._vars,
                test: {
                    case: {
                        name: caze.name,
                        iteration: caseIteration
                    },
                    suite: {
                        name: suite.name,
                        iteration: suiteIteration
                    }
                }
            }
        });
        return this._whenTestCaseFinished.promise;
    }

    async _worker_InitEngine() {
        this._worker.send({
            type: 'init',
            options: this._options
        });
        return this._whenEngineInitFinished.promise;
    }

    async _worker_DisposeEngine() {
        this._worker.send({
            type: 'dispose',
        });
        return this._whenDisposed.promise;
    }

    async _startWorkerProcess() {
        this._worker = new WorkerProcess(this._id, this._debugMode, this._debugPort);
        await this._worker.start();
        this._hookWorkerEvents();
    }

    _hookWorkerEvents() {
        // preserve this object
        const _this = this;
        this._worker.on('error', (payload) => {
            const { error } = payload;
            logger.error('error: ', error);
            _this._workerProcLastError = error;
        });
        this._worker.on('exit', (payload) => {
            const { exitCode } = payload;
            
            if (exitCode && exitCode !== 0) {
                // if the test is running or is being disposed and the child process has died,
                // then end the test or disposal with fatal error
                // (child process not suppose to die with code > 0)
                let promise = null;
                if (_this._isDisposing) {
                    promise = _this._whenDisposed;
                }
                else if (_this._isRunning) {
                    promise = _this._whenTestCaseFinished;
                }
                const error = _this._workerProcLastError || new Error(`Worker process exited with code: ${exitCode}.`);
                promise && promise.reject(error);
                _this._resetGlobalVariables();
            }
        });
        this._worker.on('message', function (msg) {
            if (msg.event && msg.event === 'log-add') {
                if (msg.level === 'DEBUG') {
                    logger.debug(msg.msg);
                } else if (msg.level === 'INFO') {
                    logger.info(msg.msg);
                } else if (msg.level === 'ERROR') {
                    logger.error(msg.msg, msg.err);
                } else if (msg.level === 'WARN') {
                    logger.warn(msg.msg);
                }

                if (msg.src === DEFAULT_ISSUER) {
                    _this.emit('log-add', msg.level, msg.msg, msg.time);
                }
            } else if (msg.event && msg.event === 'init:success') {
                _this._isInitializing = false;
                _this._whenEngineInitFinished.resolve(null);
            } else if (msg.event && msg.event === 'init:failed') {
                _this._isInitializing = false;
                _this._whenEngineInitFinished.reject(msg.err);
            } else if (msg.event && msg.event === 'run:success') {
                _this._whenTestCaseFinished.resolve(_this._processWorkerResults(msg));
                _this._whenTestCaseFinished = null;
            } else if (msg.event && msg.event === 'run:failed') {
                _this._whenTestCaseFinished.resolve(_this._processWorkerResults(msg));
                _this._whenTestCaseFinished = null;
            } else if (msg.event && msg.event === 'dispose:success') {
                _this._whenDisposed.resolve(null);
                _this._resetGlobalVariables();
            } else if (msg.event && msg.event === 'dispose:failed') {
                _this._whenDisposed.reject(msg.err);
                _this._resetGlobalVariables();
            } else if (msg.event && msg.event === 'line-update') {
                _this.emit('line-update', msg.line, msg.stack, msg.time);
            } else if (msg.event && msg.event === 'result-update') {
                if (msg.method === 'init') {
                    _this.emit('init-done', msg);
                }
            }
        });
        this._worker.on('debugger:break', (breakpoint) => {
            // assume we always send breakpoint of the top call frame
            if (breakpoint.callFrames && breakpoint.callFrames.length > 0) {
                let breakpointData = null;
                // if breakpoint.hitBreakpoints has at list one element, then report file and line based on its data
                if (breakpoint.hitBreakpoints && Array.isArray(breakpoint.hitBreakpoints) && breakpoint.hitBreakpoints.length > 0) {
                    breakpointData = extractBreakpointData(breakpoint.hitBreakpoints[0]);
                }
                // otherwise, get the line from breakpoint.callFrames[0] object (but then we won't have file path, but scriptId instead)
                else {
                    breakpointData = breakpoint.callFrames[0].location;
                }
                // TODO: fix the line below
                _this.emit('breakpoint', breakpointData, null /*ts.testcases[tcindex]*/);
            }
        });
    }

    _resetGlobalVariables() {
        this._worker = null;
        this._isRunning = false;
        this._isDisposing = false;
        this._isInitializing = false;
        this._testKilled = false;
        this.__whenTestCaseFinished = null;
        this._whenEngineInitFinished = defer();
        this._whenDisposed = defer();
    }

    _processWorkerResults(msg) {
        // if test was killed before any results were generated, then just finalize the test without processing results
        if (!msg && this._testKilled) {
            //this._finalizeTest(null);
            return null;
        }
        if (msg.err) {
            this.emit('test-error', msg.err);
        }        
        // store 'vars' part of the context for a later use
        this._vars = msg.ctx.vars || this._vars;
        // store caps for later (passing it to the final results)
        this._caps = msg.ctx.caps || this._caps;
        
        // clean up context from internal elements, not need in the report:
        // remove caps from the context as it already appears in TestResult node
        if (msg.ctx && msg.ctx.caps)
            delete msg.ctx.caps;
        // remove env from the context as it already appears in TestResult node
        if (msg.ctx && msg.ctx.env)
            delete msg.ctx.env;
        // remove test from the context as it already appears in TestResult node
        if (msg.ctx && msg.ctx.test)
            delete msg.ctx.test;
        // remove test options from the context as it already appears in TestResult node
        if (msg.context && msg.context.options)
            delete msg.context.options;

        return {
            resultStore: msg.resultStore,
            context: msg.ctx,
            error: msg.err || null
        };
    }

    _emitIterationEnd(ts, tc, suiteIterationNum, caseIterationNum, caseIterationResult) {
        this.emit('iteration-end', {
            status: caseIterationResult._status,
            failure: caseIterationResult.failure || null,
            case: {
                id: tc.id || null,
                name: tc.name,
                iteration: caseIterationNum,
                iterationCount: tc.iterationCount
            },
            suite: {
                id: ts.id || null,
                name: ts.name,
                iteration: suiteIterationNum,
                iterationCount: ts.iterationCount
            }
        });
    }

    _emitTestEnd(result) {
        this.emit('test-end', result);
    }

}

function extractBreakpointData(bpStr) {
    if (!bpStr || typeof bpStr !== 'string') {
        return null;
    }

    const parts = bpStr.split(':');
    try {
        if (process.platform === 'win32' && parts.length === 4) { // path may contain a Drive letter on win32
            return {
                fileName: parts[0] + ':' + parts[1],
                lineNumber: parseInt(parts[2]),
                columnNumber: parseInt(parts[3]),
            };
        } else {                                                // otherwise it's Unix or UNC on win32
            return {
                fileName: parts[0],
                lineNumber: parseInt(parts[1]),
                columnNumber: parseInt(parts[2]),
            };
        }
    } catch (e) {
        console.error(`Failed to extract breakpoint data: ${bpStr}`);
        return null;
    }
}

export { ParameterManager };