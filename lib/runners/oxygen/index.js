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
var originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../../../', 'config');
var config = require('config');
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;
// setup logger
var loggerFactory = require('oxygen-logger');
loggerFactory.init(config.get('logger'));
var logger = loggerFactory.get('oxygen');
const DEFAULT_ISSUER = 'user';

//import util from 'util';
import { EventEmitter } from 'events';
import _  from 'lodash';
import { defer } from 'when';

var errHelper = module.exports.errHelper = require('../../../errors/helper');

const FATAL_ERROR_TYPES = [
    errHelper.errorCode.SCRIPT_ERROR
];

export const oxUtil = require('../../util');


export const model = {};
model.TestCase = require('../../../model/testcase.js');
model.TestSuite = require('../../../model/testsuite.js');
model.TestResult = require('../../../model/test-result');
model.TestCaseResult = require('../../../model/case-result');
export const STATUS = require('../../../model/status.js');
// exports for IDE
export const ParameterManager = require('../../param-manager.js');
export const ReporterXLSX = require('../../reporters/excel-reporter.js');
export default class OxygenRunner extends EventEmitter {
    constructor() {
        super();
        // class variables
        this._isRunning = false;
        this._isInitializing = false;
        this._isDisposing = false;
        this._childProc = null;
        this._debugMode = false;
        this._dbg = null;
        this._childProcLastError = null;
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
        this._whenDisposed = defer();
        this._whenInitialized = defer();
        this._whenTestCaseFinished = null;
    }
    /*********************************
     * Public methods
     *********************************/
    async init(options, caps) {
        this._isInitializing = true;
        this._options = options;
        this._envVars = _.clone(options.envVars) || {};   // assign environment variables for later use
        this._caps = _.clone(options.caps) || {}; // assign caps for later use
        this._suite = _.clone(options.testsuite) || { testcases: [] };
        // make sure test suite is defined
        if (!options.testsuite) {
            this._whenInitialized.reject(
                new Error('Initialization failed - test suite is not defined. You must define "testsuite" property in Oxygen options.')
            );
            return this._whenInitialized.promise;
        }
        else if (!options.testsuite.testcases || !Array.isArray(options.testsuite.testcases)) {
            this._whenInitialized.reject(
                new Error('Initialization failed - test cases are not defined. You must define "testcases" property in Oxygen options.')
            );
            return this._whenInitialized.promise;
        }
        // set up debugging port
        const forkOpt = { cwd: __dirname };
        let debugPort = null;
        // TODO: this needs to be reimplemented. Everything related to debugging (initializeDebugger) should be removed from Oxygen
        // and added to IDE instead. I.e. the only thing oxygen should do is to launch the child process with the debugging switch.
        if (options.debugPort || options.debugPortIde) {
            this.debugMode = true;
            debugPort = options.debugPort || options.debugPortIde;
            forkOpt = Object.assign(forkOpt, { execArgv: ['--inspect-brk=' + debugPort] });
        }
        options.scriptContentLineOffset = this._scriptContentLineOffset;
        this._localTime = (this._options.reporter && this._options.reporter.localTime) || this._localTime;
        // fork boilerplate.js
        const fork = require('child_process').fork;
        this._childProc = fork(path.join(__dirname, 'boilerplate.js'), forkOpt);
        this._hookChildProcEvents(this._childProc);
        // if we are in debug mode, initialize debugger and only then start modules 'init'
        if (this.debugMode) {
            // delay debugger initialization, as debugger port might not be open yet right after the process fork
            setTimeout(function() {
                this._initializeDebugger(debugPort, this._childProc, options).catch(e => {
                    this._isInitializing = false;
                    this._whenInitialized.reject(e.message);
                }); 
            }, 1000);
        } else {
            // start script boilerplate initialization right now if not in debugging
            this._childProc.send({
                type: 'init',
                options: options
            });
        }
        return this._whenInitialized.promise;
    };

    dispose() {
        this._isDisposing = true;
        if (this._testKilled) {
            if (this._dbg) {
                this._dbg.close();
            }
            this.resetGlobalVariables();
            this._whenDisposed.resolve(null);
        } else {
            if (this._dbg) {
                this._dbg.close().then(function() {
                    if (this._childProc) {
                        this._childProc.send({type: 'dispose-modules'});
                    }
                });
            } else if (this._childProc) {
                this._childProc.send({type: 'dispose-modules'});
            }
        }
        return this._whenDisposed.promise;
    };

    async run() {
        if (this._isInitializing) {
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        }
        if (this._isRunning) {
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        }
        this._isRunning = true;
        
        const result = new model.TestResult();
        result.summary._startTime = oxUtil.getTimeStamp();
        result.summary._name = this._suite.name;
        result.summary._status = STATUS.PASSED;
        let error = null;
        try {
            for (let suiteIteration=1; suiteIteration <= this._suite.iterationCount; suiteIteration++) {
                const suiteIterationResult = new model.TestSuiteIterationResult();
                suiteIterationResult._startTime = oxUtil.getTimeStamp();
                suiteIterationResult._iterationNum = suiteIteration;
                suiteIterationResult._status = STATUS.PASSED;
                for (let tc of this._suite.testcases) {
                    const testCaseResult = new model.TestCaseResult();   
                    testCaseResult._startTime = oxUtil.getTimeStamp();
                    testCaseResult._status = STATUS.PASSED;         
                    for (let caseIteration=1; caseIteration <= tc.iterationCount; caseIteration++) {
                        const tciResult = await this._runTestCase(tc, suiteIteration, caseIteration);
                        if (!tciResult) {
                            continue;
                        }
                        tciResult._id = tc.id || null;
                        tciResult._name = tc.name;          
                        tciResult._iterationNum = caseIteration;      
                        testCaseResult.iterations.push(tciResult);
                        this._emitIterationEnd(this._suite, tc, suiteIteration, caseIteration, tciResult);
                        // if test case iteration has failed, then mark the entire test case as failed, 
                        // stop iterating over it and move to the next test case
                        if (tciResult._status === STATUS.FAILED) {
                            testCaseResult._status = STATUS.FAILED;
                            break;
                        }
                    }                
                    testCaseResult._id = tc.id || null;
                    testCaseResult._name = tc.name;                
                    testCaseResult._endTime = oxUtil.getTimeStamp();
                    testCaseResult._duration = testCaseResult._endTime - testCaseResult._startTime;
                    // derive suite iteration status from test case result status
                    if (testCaseResult._status === STATUS.FAILED) {
                        suiteIterationResult._status = STATUS.FAILED;
                    }
                    suiteIterationResult.testcases.push(testCaseResult);
                }
                suiteIterationResult._endTime = oxUtil.getTimeStamp();
                suiteIterationResult._duration = suiteIterationResult._endTime - suiteIterationResult._startTime;
                // derive suite iteration status from test case result status
                if (suiteIterationResult._status === STATUS.FAILED) {
                    result.summary._status = STATUS.FAILED;
                }
                result.iterations.push(suiteIterationResult);
            }
        }
        catch (e) {
            error = e;
        }
        result.summary._endTime = oxUtil.getTimeStamp();
        result.summary._totalCases = this._suite.testcases.length;
        result.environment = this._envVars;
        result.capabilities = JSON.parse(JSON.stringify(this._caps));    // assign a copy of _caps object
        result.options = JSON.parse(JSON.stringify(this._options));  // assign a copy of _options object

        // if error occured, add it to the summary
        if (error) {
            result.summary.failure = this._generateFailureObject(error);
            result.summary._status = STATUS.FAILED;
        }
        this._isRunning = false;
        this._emitTestEnd(result);
        return result;
    };

    kill() {
        this._testKilled = true;
        if (this._childProc) {
            this._childProc.kill();
        }
    };

    debugContinue() {
        if (this.debugMode && this._dbg) {
            this._dbg.continue();
        }
    };

    setBreakpoint(line) {
        if (this.debugMode && this._dbg && this._suite && this._suite.testcases) {
            const tc = this._suite.testcases[tcindex];
            logger.debug('oxygen.setBreakpoint: ' + (line + this._scriptContentLineOffset));
            this._dbg.setBreakpoint(tc.name, line + this._scriptContentLineOffset);
        }
    };

    clearBreakpoint(line) {
        if (this.debugMode && this._dbg) {
            this._dbg.clearBreakpoint(line + this._scriptContentLineOffset, null);
        }
    };

    /*********************************
     * Private methods
     *********************************/
    _hookChildProcEvents() {
        // preserve this object
        const _this = this;
        this._childProc.on('error', function (err) {
            logger.error('error: ', err);
            _this._childProcLastError = err;
        });
        this._childProc.on('disconnect', function () {
            logger.debug('script-boilerplate process disconnected');
        });
        this._childProc.on('uncaughtException', function (err) {
            logger.error('uncaughtException: ', (err && err.stack) ? err.stack : err);
            _this._childProcLastError = err;
        });
        this._childProc.on('exit', function (code, signal) {
            logger.debug('script-boilerplate process exited with code: ' + code + ', signal: ' + signal);
            if (_this._dbg) {
                _this._dbg.close();
            }
            if (code && code !== 0) {
                //logger.debug('script-boilerplate process exited with code: ' + code + ', signal: ' + signal);
                // if the test is running or is being disposed and the child process has died,
                // then finish the test or disposal with fatal error
                // (child process not suppose to die with code > 0)
                var promise, error;
                if (_this._isRunning || _this._isDisposing) {
                    promise = _this._isRunning ? _this._whenTestCaseFinished : _this._whenDisposed;
                    error = _this._childProcLastError || new Error('script-boilerplate process exited with code: ' + code);
                    promise && promise.reject(error);
                    _this._resetGlobalVariables();
                }
            }
        });
        this._childProc.on('message', function (msg) {
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
            } else if (msg.event && msg.event === 'init-success') {
                _this._isInitializing = false;
                _this._whenInitialized.resolve(null);
            } else if (msg.event && msg.event === 'init-failed') {
                _this._isInitializing = false;
                _this._whenInitialized.reject(msg.err);
            } else if (msg.event && msg.event === 'execution-ended') {
                _this._whenTestCaseFinished.resolve(_this._processResults(msg));
                _this._whenTestCaseFinished = null;
            } else if (msg.event && msg.event === 'modules-disposed') {
                _this._resetGlobalVariables();
                _this._whenDisposed.resolve(null);
            } else if (msg.event && msg.event === 'line-update') {
                _this.emit('line-update', msg.line, msg.stack, msg.time);
            } else if (msg.event && msg.event === 'result-update') {
                if (msg.method === 'init') {
                    _this.emit('init-done', msg);
                }
            }
        });
    }

    async _initializeDebugger(debugPort, childProc, options) {
        const Debugger = require('./debugger');
        this._dbg = new Debugger();   
        // handle debugger events     
        this._dbg.on('ready', function(err) {
            // resume the first breakpoint which is automatically added by the debugger
            this._dbg.continue(); 
            // start script boilerplate initialization sequence
            this._childProc.send({
                type: 'init',
                options: options
            });
        });
        this._dbg.on('error', function(err) {
            logger.error('Debugger error', err);
        });
        this._dbg.on('break', function(breakpoint) {
            // assume we always send breakpoint of the top call frame
            if (breakpoint.callFrames && breakpoint.callFrames.length > 0 && ts) {
                let breakpointData = null;
                // if breakpoint.hitBreakpoints has at list one element, then report file and line based on its data
                if (breakpoint.hitBreakpoints && Array.isArray(breakpoint.hitBreakpoints) && breakpoint.hitBreakpoints.length > 0) {
                    breakpointData = extractBreakpointData(breakpoint.hitBreakpoints[0]);                    
                }
                // otherwise, get the line from breakpoint.callFrames[0] object (but then we won't have file path, but scriptId instead)
                else {
                    breakpointData = breakpoint.callFrames[0].location;
                }                
                this.emit('breakpoint', breakpointData, ts.testcases[tcindex]);
            }
        });
        // connect to Chrome debugger
        await this._dbg.connect(debugPort);
    }

    _resetGlobalVariables() {
        this._childProc = null;
        this._isRunning = false;
        this._isDisposing = false;
        this._isInitializing = false;
        this._testKilled = false;
        this.__whenTestCaseFinished = null;
    }

    async _runTestCase(tc, suiteIteration, caseIteration) {
        this.emit('iteration-start', caseIteration);
        const params = {};

        // get test suite's parameters if defined
        // get them first and then override with test case level parameters if defined
        if (this._suite.paramManager) {
            _.extend(params, this._suite.paramManager.getValues());
            this._suite.paramManager.readNext();
        }
        // read test case's next lines of parameters if parameter manager is defined
        if (tc.paramManager) {
            _.extend(params, tc.paramManager.getValues());
            tc.paramManager.readNext();
        }

        const msg = {
            type: 'run-script',
            scriptName: tc.name,
            scriptPath: tc.path,
            scriptContent: tc.content,
            context: {
                params: params,
                env: this._envVars,
                caps: this._caps,
                vars: this._vars,
                test: {
                    case: {
                        name: tc.name,
                        iteration: caseIteration
                    },
                    suite: {
                        name: this._suite.name,
                        iteration: suiteIteration
                    }
                }
            }
        };
        // define a promise
        this._whenTestCaseFinished = defer();
        // add breakpoints before running the script if in debug mode
        if (this.debugMode && this._dbg && tc.breakpoints) {
            let promises = [];
            for (let i=0; i< tc.breakpoints.length; i++) {
                // editor index starts from 1, but we need zero based index
                let line = tc.breakpoints[i].line;
                let file = tc.breakpoints[i].file;
                // if test case's script file is the same as the file with breakpoint, add extra boilerplate's wrapper lines
                if (tc.path === file) {
                    line = this._scriptContentLineOffset + line;
                }
                promises.push(this._dbg.setBreakpoint(file, line));
            }
            // wait for all setBreakpoint calls to complete before running the test
            Promise.all(promises).then(() => childProc.send(msg));
        }
        else {
            // if we are not in the debugging mode, start the test immediately
            this._childProc.send(msg);
        }
        return this._whenTestCaseFinished.promise;
    }

    _processResults(msg) {
        // if test was killed before any results were generated, then just finalize the test without processing results
        if (!msg && this._testKilled) {
            //this._finalizeTest(null);
            return null;
        }
        if (msg.error) {
            this.emit('test-error', msg.error);
        }
        // store 'vars' part of the context for a later use
        this._vars = msg.context.vars || {};
        // store caps for later (passing it to the final results)
        this._caps = msg.context.caps || _caps;
        // store results into a variable
        const res = msg.results;
        const testCaseIterationResult = new model.TestCaseIterationResult();
        testCaseIterationResult._startTime = msg.startTime;
        testCaseIterationResult._endTime = msg.endTime;
        testCaseIterationResult._duration = msg.duration;
        testCaseIterationResult.context = msg.context;
        // clean up context from internal elements, not need in the report:
        // remove caps from the context as it already appears in TestResult node
        if (msg.context && msg.context.caps)
            delete msg.context.caps;
        // remove env from the context as it already appears in TestResult node
        if (msg.context && msg.context.env)
            delete msg.context.env;
        // remove test from the context as it already appears in TestResult node
        if (msg.context && msg.context.test)
            delete msg.context.test;
        // remove test options from the context as it already appears in TestResult node
        if (msg.context && msg.context.options)
        delete msg.context.options;
        testCaseIterationResult.steps = res.steps;
        testCaseIterationResult.logs = res.logs;
        testCaseIterationResult.har = res.har;

        // determine test case iteration status - mark it as failed if any step has failed
        var failedSteps = _.find(res.steps, {_status: STATUS.FAILED});
        testCaseIterationResult._status = _.isEmpty(failedSteps) && !msg.error ? STATUS.PASSED : STATUS.FAILED;
        if (msg.error) {
            testCaseIterationResult.failure = this._generateFailureObject(msg.error);
        }
        return testCaseIterationResult;
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

    _generateFailureObject(error) {
        if (!error) {
            return null;
        }
        var failure = new require('../../../model/stepfailure')();
        failure._message = error.message;
        failure._type = error.type ? error.type : 'INVALID_ERROR';
        failure._line = error.line || null;
        failure._data = error.data || null;
        failure._details = error.line ? 'at line ' + error.line : null;
        if (error.type) {
            failure._fatal = (error.type && _.includes(FATAL_ERROR_TYPES, error.type)).toString();
        } else {
            failure._fatal = 'true';
        }
        return failure;
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
