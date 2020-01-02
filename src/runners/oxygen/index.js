/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import logger from '../../lib/logger';
const log = logger('OxygenRunner');
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
import OxygenError from '../../errors/OxygenError';
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
        this._modCaps = {};
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
    async init(options, caps = {}, reporter) {
        // make sure at least one test suite is defined
        if (!options.suites) {
            throw new Error('Initialization failed - no test suites are defined. You must define "suites" property in Oxygen options.');
        }

        this._options = options;
        this._cwd = this._options.cwd || process.cwd();
        this._reporter = reporter;
        this._isInitialized = true;

        this._env = { ...(options.env || options.envVars || {}) };   // assign environment variables for later use
        this._caps = { ...caps }; // assign caps for later use
        this._suites = [ ...options.suites ];
        // set up debugging options
        // TODO: this needs to be reimplemented. Everything related to debugging (initializeDebugger) should be removed from Oxygen
        // and added to IDE instead. I.e. the only thing oxygen should do is to launch the child process with the debugging switch.
        this._debugMode =  options.debugPortIde ? true : false;
        this._debugPort = options.debugPort || options.debugPortIde || null;
        options.scriptContentLineOffset = this._scriptContentLineOffset;
        this._localTime = (this._options && this._options.localTime) || this._localTime;
        await this._startWorkerProcess();
        await this._worker_InitOxygen();
    }

    async dispose() {
        this._isDisposing = true;
        try {
            if(!this._testKilled && this._worker && this._worker.isRunning){
                await this._worker_DisposeOxygen();
                await this._worker.stop();
            }
        } catch (e) {
            // ignore errors during the dispose
            log.warn('Error when disposing Runner:', e);
        }
        this._resetGlobalVariables();
    }

    async run() {
        if (this._isInitializing) {
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        }
        if (this._isRunning) {
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        }
        this._isRunning = true;

        this._reporter.onRunnerStart(this._id, this._options, this._caps);

        let error = null;
        let result = null;
        try {
            result = await this._runTest();
        }
        catch (e) {
            error = e;
        }
        this._reporter.onRunnerEnd(this._id, result, error);
        this._isRunning = false;
        if (this._worker) {
            await this._worker.stop();
        }
        if (error) {
            throw error;
        }
        return result;
    }

    async kill() {
        this._testKilled = true;
        if (this._worker) {
            await this._worker.stop();
        }
        this._resetGlobalVariables();
    }

    debugContinue() {
        if (this._debugMode && this._worker) {
            this._worker.debugger.continue();
        } 
    }

    updateBreakpoints(breakpoints, filePath){
        try {
            // var tc;

            // if (ts && ts.testcases && ts.testcases[tcindex]) {
            //     tc = ts.testcases[tcindex];
            // }

            if (this._debugMode && this._worker.debugger /* && tc */) {
                let promises = [];

                // // adjust breakpoint line numbers
                // breakpoints = breakpoints.map((bp) => {
                //     // for primary file we add offset due to script-boilerplate code
                //     // for secondary files just reduce by 1 since BP indices are 0-based
                //     return (tc.path === filePath ? bp + module.getScriptContentLineOffset: bp - 1);
                // });

                const tsBreakpoints = this._worker.debugger.getBreakpoints(filePath);

                // add new breakpoints
                for (var userSetBp of breakpoints) {
                    if (!tsBreakpoints.includes(userSetBp)) {
                        promises.push(this._worker.debugger.setBreakpoint(filePath, userSetBp));
                    }
                }

                // remove deleted breakpoints
                for (var actualCurrentBp of tsBreakpoints) {
                    if (!breakpoints.includes(actualCurrentBp)) {
                        promises.push(this._worker.debugger.removeBreakpointByValue(filePath, actualCurrentBp));
                    }
                }

                Promise.all(promises).then(() => {
                    log.debug('updateBreakpoints() done.');
                });
            }
        } catch(e){
            log.error('Debugger error', e);
        }
    }

    setBreakpoint(line) {
        /*
        if (this.debugMode && this._worker && this._worker.debugger && this._suite && this._suite.testcases) {
            const tc = this._suite.testcases[tcindex];
            log.debug('oxygen.setBreakpoint: ' + (line + this._scriptContentLineOffset));
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
        result.environment = { ...this._env };
        // combine test defined caps and per module capabilities, that were passed by user in each module's init function
        result.capabilities = { ...this._caps, ...this._modCaps };    // assign a copy of _caps object
        result.options = { ...this._options };  // assign a copy of _options object

        // if error occured, add it to the summary
        if (error) {
            result.failure = errorHelper.getFailureFromError(error);
            result.status = Status.FAILED;
        }
        return result;
    }

    async _runSuite(suite) {
        if (!suite) {
            log.error('suite is null in _runSuite()!!!');
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
                        log.warn('_runCase returned null');
                        continue;
                    }
                    suiteResult.cases.push(caseResult);
                    // if test case iteration has failed, then mark the entire test case as failed, 
                    // stop iterating over it and move to the next test case
                    if (caseResult.status === Status.FAILED) {
                        suiteResult.status = Status.FAILED;
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

                // // if test case's script file is the same as the file with breakpoint, add extra boilerplate's wrapper lines
                // if (caze.path === file) {
                //     line = this._scriptContentLineOffset + line;
                // }


                await this._worker.debugger.setBreakpoint(file, line);
            }
        }
        //this.emit('iteration:start', caseIteration);
        this._reporter.onCaseStart(this._id, suite.uri || suite.id, caze.uri || caze.id || caze.path, caze);
        const caseResult = new TestCaseResult();
        caseResult.name = caze.name;
        caseResult.location = caze.path;
        // try to initialize Oxygen and handle any possible error
        try {            
            await (!(this._worker && this._worker.isOxygenInitialized) && this._worker_InitOxygen());
        }
        catch (e) {
            log.error('_worker_InitOxygen() thrown an error:', e);
            caseResult.startTime = caseResult.endTime = oxutil.getTimeStamp();
            caseResult.duration = 0;
            caseResult.failure = errorHelper.getFailureFromError(e);
            caseResult.status = Status.FAILED;
            this._reporter.onCaseEnd(this._id, suite.uri || suite.id, caze.uri || caze.id, caseResult);
            return caseResult;
        }
        // run the test in the worker process and handle any possible error
        try {
            caseResult.startTime = oxutil.getTimeStamp();
            const { resultStore, context, error } = await this._worker_Run(suite, caze, suiteIteration, caseIteration, params);
            caseResult.endTime = oxutil.getTimeStamp();
            await (this._worker && this._worker.isOxygenInitialized && this._worker_DisposeModules());
            caseResult.duration = caseResult.endTime - caseResult.startTime;
            caseResult.context = context;
            caseResult.steps = resultStore && resultStore.steps ? resultStore.steps : [];
            caseResult.logs = resultStore && resultStore.logs ? resultStore.logs : [];
            caseResult.har = resultStore && resultStore.har ? resultStore.har : null;

            // determine test case iteration status - mark it as failed if any step has failed
            var failedSteps = _.find(caseResult.steps, {status: Status.FAILED});
            caseResult.status = _.isEmpty(failedSteps) && !error ? Status.PASSED : Status.FAILED;
            if (error) {
                caseResult.failure = error;
                caseResult.status = Status.FAILED;
            }
        } catch (e) {
            log.error('_worker_Run() thrown an error:', e);
            caseResult.failure = errorHelper.getFailureFromError(e);
            caseResult.status = Status.FAILED;
            
        } 
        this._reporter.onCaseEnd(this._id, suite.uri || suite.id, caze.uri || caze.id, caseResult);
        return caseResult;
    }
    
    async _worker_Run(suite, caze, suiteIteration, caseIteration, params) {
        // define a promise
        this._whenTestCaseFinished = defer();
        if (!this._worker) {
            log.error('_worker is null but not suppose to!');
            this._whenTestCaseFinished.reject(new Error('_worker is null'));
        }
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
            },
            poFile: this._options.po || null
        });
        return this._whenTestCaseFinished.promise;
    }

    async _worker_InitOxygen() {
        await (this._worker && this._worker.initOxygen(this._options, this._caps));
    }

    async _worker_DisposeOxygen() {
        if(this._worker && this._worker.disposeOxygen){
            await this._worker.disposeOxygen();
        }
    }

    async _worker_DisposeModules() {
        if(this._worker && this._worker.disposeModules){
            await this._worker.disposeModules();
        }
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
            log.error('Worker process error: ', error);
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
                let error = _this._workerProcLastError || null;
                if (exitCode == 134) {
                    error = new OxygenError(errorHelper.errorCode.SCRIPT_ERROR, 'Out of memory error. Make sure that you don\'t have any memory leaks in the test script.');
                }
                else if (!error) {
                    error = new OxygenError(`Worker process exited with code: ${exitCode}.`);
                }                
                
                promise && promise.reject(error);
                _this._resetGlobalVariables();
            }
        });
        this._worker.on('message', (msg) => {
            if (msg.event && msg.event === 'log') {
                if (msg.level === 'DEBUG') {
                    log.debug(msg.msg);
                } else if (msg.level === 'INFO') {
                    log.info(msg.msg);
                } else if (msg.level === 'ERROR') {
                    log.error(msg.msg, msg.err);
                } else if (msg.level === 'WARN') {
                    log.warn(msg.msg);
                }

                _this.emit('log', msg.time, msg.level, msg.msg, msg.src || DEFAULT_ISSUER);
                _this._reporter && _this._reporter.onLogEntry(msg.time, msg.level, msg.msg, msg.src || DEFAULT_ISSUER);
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
            } /*else if (msg.event && msg.event === 'dispose:success') {
                _this._whenDisposed.resolve(null);
                _this._resetGlobalVariables();
            } else if (msg.event && msg.event === 'dispose:failed') {
                _this._whenDisposed.reject(msg.err);
                _this._resetGlobalVariables();
            } */else if (msg.event && msg.event === 'command:before') {
                if(!this._id){
                    throw new Error('this._id is not exist');
                }

                _this._reporter && _this._reporter.onStepStart(this._id, msg.command);
            } else if (msg.event && msg.event === 'command:after') {
                _this._reporter && _this._reporter.onStepEnd(this._id, msg.command);
            } else if (msg.event && msg.event === 'line-update') {
                _this.emit('line-update', msg.line, msg.stack, msg.time);
            } else if (msg.event && msg.event === 'result-update') {
                if (msg.method === 'init') {
                    _this.emit('init-done', msg);
                }
            }
        });

        this._worker.debugger && this._worker.debugger.on('debugger:break', (breakpoint, variables) => {
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

                if(variables){
                    breakpointData.variables = variables;
                }
                
                _this.emit('breakpoint', breakpointData);
            }
        });
    }

    _resetGlobalVariables() {
        this._modCaps = {};
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
        // store 'modCaps' part of the context for a later use
        this._modCaps = { ...this._modCaps, ...msg.ctx.moduleCaps || {} };
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
        
        let fileName;
        let lineNumber;

        if (process.platform === 'win32') { // path may contain a Drive letter on win32
            fileName = parts[parts.length-2] + ':' + parts[parts.length-1];
            lineNumber = parseInt(parts[1]);
        } else {
            fileName = parts[parts.length-1];
            lineNumber = parseInt(parts[1]);
        }
    
        return {
            fileName: fileName,
            lineNumber: lineNumber
        };

    } catch (e) {
        log.error(`Failed to extract breakpoint data: ${bpStr}`);
        return null;
    }
}

export { ParameterManager };