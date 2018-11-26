/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
var path = require('path');

// explicitly set the config dir, otherwise if oxygen is globally installed it will use cwd
var originalNodeCfgDir = process.env.NODE_CONFIG_DIR;
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '..', 'config');
var config = require('config');
process.env.NODE_CONFIG_DIR = originalNodeCfgDir;

// setup logger
var loggerFactory = require('oxygen-logger');
loggerFactory.init(config.get('logger'));
var logger = loggerFactory.get('oxygen');

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var moment = require('moment');
var _ = require('lodash');
const STATUS = require('../model/status.js');

var errHelper = module.exports.errHelper = require('../errors/helper');

const FATAL_ERROR_TYPES = [
    errHelper.errorCode.SCRIPT_ERROR
];

module.exports.util = require('./util');

module.exports.model = {};
module.exports.model.TestCase = require('../model/testcase.js');
module.exports.model.TestSuite = require('../model/testsuite.js');
module.exports.STATUS = require('../model/status.js');
// exports for IDE
module.exports.ParameterManager = require('./param-manager.js');
module.exports.ReporterXLSX = require('./reporters/excel-reporter.js');

module.exports.Runner = function () {
    var defer = require('when').defer;
    var module = {};
    // inherit from EventEmitter
    var ee = {};
    ee.prototype = Object.create(EventEmitter.prototype);
    util.inherits(ee, EventEmitter);
    // class variables
    var _isRunning = false;
    var _isInitializing = false;
    var _isDisposing = false;
    var childProc = null;
    var debugMode = false;
    var dbg = null;
    var _childProcLastError = null;
    // define variables to iterate through test cases and test suite iterations
    var ts;
    var tcindex = 0;    // current test case index
    var tcit = 1;       // current test case iteration counter
    var tsit = 1;       // current test suite iteration counter
    var tr = null;      // current test results
    var startTime = null;
    var endTime = null;
    var _envVars = {};  // environment variables passed at the beginning of the test
    var _vars = {};     // user-defined variables that are shared between different scripts
    var _caps = {}; // desired capabilities that are passed to each module
    var _options = null;
    var _localTime = false;
    var _lastResultUpdate = null;
    var _testKilled = false;
    // promises
    var _whenDisposed = defer();
    var _whenFinished = defer();
    var _whenInitialized = defer();
    /*********************************
     * Public methods
     *********************************/
    module.init = function (options) {
        _isInitializing = true;
        _options = options;
        // set up debugging port
        var forkOpt = { cwd: __dirname };
        var debugPort = null;
        // TODO: this needs to be reimplemented. Everything related to debugging (initializeDebugger) should be removed from Oxygen
        // and added to IDE instead. I.e. the only thing oxygen should do is to launch the child process with the debugging switch.
        if (options.debugPort || options.debugPortIde) {
            debugMode = true;
            debugPort = options.debugPort || options.debugPortIde;
            forkOpt = Object.assign(forkOpt, { execArgv: ['--inspect-brk=' + debugPort] });
        }
        options.scriptContentLineOffset = module.getScriptContentLineOffset;
        _localTime = (_options.reporter && _options.reporter.localTime) || _localTime;
        // fork script-boilerplate
        var fork = require('child_process').fork;
        childProc = fork(path.join(__dirname, 'script-boilerplate.js'), forkOpt);
        hookChildProcEvents(childProc);
        // if we are in debug mode, initialize debugger and only then start modules 'init'
        if (debugMode) {
            // delay debugger initialization, as debugger port might not be open yet right after the process fork
            setTimeout(function() {
                try {
                    initializeDebugger(debugPort, childProc, options);
                }
                catch(e) {
                    console.error(e);
                    throw e;
                }
            }, 1000);
        } else {
            // start script boilerplate initialization right now if not in debugging
            childProc.send({
                type: 'init',
                options: options
            });
        }

        return _whenInitialized.promise;
    };

    module.dispose = function() {
        _isDisposing = true;
        if (_testKilled) {
            if (dbg) {
                dbg.close();
            }
            resetGlobalVariables();
            _whenDisposed.resolve(null);
        } else {
            if (dbg) {
                dbg.close().then(function() {
                    if (childProc) {
                        childProc.send({type: 'dispose-modules'});
                    }
                });
            } else {
                childProc.send({type: 'dispose-modules'});
            }
        }
        return _whenDisposed.promise;
    };

    module.run = function (testsuite, envVars, caps) {
        if (_isInitializing) {
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        }
        if (_isRunning) {
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        }
        _isRunning = true;
        _envVars = _.clone(envVars) || {};   // assign environment variables for later use
        _caps = _.clone(caps) || {}; // assign caps for later use
        ts = _.clone(testsuite);
        tr = new require('../model/testresult')();
        startTime = moment.utc();
        runTestCase();

        return _whenFinished.promise;
    };

    module.kill = function () {
        _testKilled = true;
        if (childProc) {
            childProc.kill();
        }
        processResultsAndRunTheNextIteration(_lastResultUpdate);
    };

    module.debugContinue = function() {
        if (debugMode && dbg) {
            dbg.continue();
        }
    };

    module.setBreakpoint = function(line) {
        if (debugMode && dbg && ts && ts.testcases) {
            var tc = ts.testcases[tcindex];
            logger.debug('oxygen.setBreakpoint: ' + (line + module.getScriptContentLineOffset));
            dbg.setBreakpoint(tc.name, line + module.getScriptContentLineOffset);
        }
    };

    module.clearBreakpoint = function(line) {
        if (debugMode && dbg) {
            dbg.clearBreakpoint(line + module.getScriptContentLineOffset, null);
        }
    };

    // NOTE: needs to be updated on any changes to the script wrapper in script-boilerplate
    // FIXME: make this dynamic variable, as line offset may vary, 
    // depends on number of modules that have '_iterationStart' method implemented
    module.getScriptContentLineOffset = 3;  

    module.on = ee.super_.prototype.on.bind(ee);
    ee.emit = ee.super_.prototype.emit.bind(ee);

    /*********************************
     * Private methods
     *********************************/
    function hookChildProcEvents() {
        childProc.on('error', function (err) {
            logger.error('error: ', err);
            _childProcLastError = err;
        });
        childProc.on('disconnect', function () {
            logger.debug('script-boilerplate process disconnected');
        });
        childProc.on('uncaughtException', function (err) {
            logger.error('uncaughtException: ', (err && err.stack) ? err.stack : err);
            _childProcLastError = err;
        });
        childProc.on('exit', function (code, signal) {
            logger.debug('script-boilerplate process exited with code: ' + code + ', signal: ' + signal);
            if (dbg) {
                dbg.close();
            }
            if (code && code !== 0) {
                //logger.debug('script-boilerplate process exited with code: ' + code + ', signal: ' + signal);
                // if the test is running or is being disposed and the child process has died,
                // then finish the test or disposal with fatal error
                // (child process not suppose to die with code > 0)
                var promise, error;
                if (_isRunning || _isDisposing) {
                    promise = _isRunning ? _whenFinished : _whenDisposed;
                    error = _childProcLastError || new Error('script-boilerplate process exited with code: ' + code);
                    promise.reject(error);
                    resetGlobalVariables();
                }
            }
        });
        childProc.on('message', function (msg) {
            if (msg.event && msg.event === 'log-add') {
                if (msg.level === 'DEBUG') logger.debug(msg.msg);
                else if (msg.level === 'INFO') logger.info(msg.msg);
                else if (msg.level === 'ERROR') logger.error(msg.msg, msg.err);
                else if (msg.level === 'WARN') logger.warn(msg.msg);
            } else if (msg.event && msg.event === 'ui-log-add') { // IDE log panel. event from module-log.
                ee.emit('ui-log-add', msg.level, msg.msg);
            } else if (msg.event && msg.event === 'init-success') {
                _isInitializing = false;
                _whenInitialized.resolve(null);
            } else if (msg.event && msg.event === 'init-failed') {
                _isInitializing = false;
                _whenInitialized.reject(msg.err);
            } else if (msg.event && msg.event === 'execution-ended') {
                processResultsAndRunTheNextIteration(msg);
            } else if (msg.event && msg.event === 'modules-disposed') {
                resetGlobalVariables();
                _whenDisposed.resolve(null);
            } else if (msg.event && msg.event === 'line-update') {
                ee.emit('line-update', msg.line);
            } else if (msg.event && msg.event === 'result-update') {
                if (msg.method === 'init') {
                    ee.emit('init-done', msg);
                }
                _lastResultUpdate = msg;
            }
        });
    }

    function initializeDebugger(debugPort, childProc, options) {
        var Debugger = require('./debugger');
        dbg = new Debugger();
        dbg.connect(debugPort);
        dbg.on('ready', function(err) {
            // resume the first breakpoint which is automatically added by the debugger
            dbg.continue(); 
            // start script boilerplate initialization sequence
            childProc.send({
                type: 'init',
                options: options
            });
        });
        dbg.on('error', function(err) {
            logger.error('Debugger error', err);
        });
        dbg.on('break', function(breakpoint) {
            // assume we always send breakpoint of the top call frame
            if (breakpoint.callFrames && breakpoint.callFrames.length > 0 && ts) {
                ee.emit('breakpoint', breakpoint.callFrames[0].location, ts.testcases[tcindex]);
            }
        });
    }

    function resetGlobalVariables() {
        tcindex = 0;    // current test case index
        tcit = 1;       // current test case iteration counter
        tsit = 1;       // current test suite iteration counter
        tr = null;      // current test results
        startTime = null;
        endTime = null;
        childProc = null;
        _isRunning = false;
        _isDisposing = false;
        _isInitializing = false;
        _lastResultUpdate = null;
        _testKilled = false;
    }

    function runTestCase() {
        ee.emit('iteration-start', tcit);
        var tc = ts.testcases[tcindex];
        var params = {};

        // get test suite's parameters if defined
        // get them first and then override with test case level parameters if defined
        if (ts.paramManager) {
            _.extend(params, ts.paramManager.getValues());
            ts.paramManager.readNext();
        }
        // read test case's next lines of parameters if parameter manager is defined
        if (tc.paramManager) {
            _.extend(params, tc.paramManager.getValues());
            tc.paramManager.readNext();
        }

        var msg = {
            type: 'run-script',
            scriptName: tc.name,
            scriptPath: tc.path,
            scriptContent: tc.content,
            context: {
                params: params,
                env: _envVars,
                caps: _caps,
                vars: _vars,
                test: {
                    case: {
                        name: tc.name,
                        iteration: tcit
                    },
                    suite: {
                        name: ts.name,
                        iteration: tsit
                    }
                }
            }
        };
        // add breakpoints before running the script if in debug mode
        if (debugMode && dbg && tc.breakpoints) {
            let promises = [];
            for (let i=0; i< tc.breakpoints.length; i++) {
                // editor index starts from 1, but we need zero based index
                let line = tc.breakpoints[i].line;
                let file = tc.breakpoints[i].file;
                // if test case's script file is the same as the file with breakpoint, add extra boilerplate's wrapper lines
                if (tc.path === file) {
                    line = module.getScriptContentLineOffset + line;
                }
                promises.push(dbg.setBreakpoint(file, line));
            }
            // wait for all setBreakpoint calls to complete before running the test
            Promise.all(promises).then(() => childProc.send(msg));
        }
        else {
            // if we are not in the debugging mode, start the test immediately
            childProc.send(msg);
        }
    }

    function processResultsAndRunTheNextIteration(msg) {
        // if test was killed before any results were generated, then just finalize the test without processing results
        if (!msg && _testKilled) {
            finalizeTest(null);
            return;
        }
        if (msg.error) {
            ee.emit('test-error', msg.error);
        }
        // clear all breakpoints if in debug mode
        if (debugMode && dbg) {
            dbg.clearBreakpoints();
        }

        // store 'vars' part of the context for a later use
        _vars = msg.context.vars || {};
        // store caps for later (passing it to the final results)
        _caps = msg.context.caps || _caps;
        // store results into a variable
        var res = msg.results;

        var tc = ts.testcases[tcindex];
        // make sure testcase iterationCount is defined
        if (!tc.iterationCount) {
            tc.iterationCount = 1;
        }
        var curTSIt = null;
        if (tsit > tr.iterations.length) {
            tr.iterations.push(curTSIt = new require('../model/tsiresult')());
            curTSIt._status = STATUS.PASSED;
        } else {
            curTSIt = tr.iterations[tsit-1];
        }
        // set test suite iteration number
        curTSIt._iterationNum = tsit;

        var curTCRes = null;
        if (curTSIt.testcases.length == tcindex + 1) {
            curTCRes = curTSIt.testcases[tcindex];
        } else {
            curTSIt.testcases.push(curTCRes = require('../model/tcresult')());
        }
        curTCRes._id = tc.id || null;
        curTCRes._name = tc.name;
        curTCRes._startTime = msg.startTime;
        curTCRes._endTime = msg.endTime;
        curTCRes._duration = msg.duration;

        var curTCIt = null;
        if (curTCRes.iterations.length == tcit) {
            curTCIt = curTCRes.iterations[tcit - 1];
        } else {
            curTCRes.iterations.push(curTCIt = new require('../model/tciresult')());
        }
        curTCIt._iterationNum = tcit;
        curTCIt.context = msg.context;
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
        curTCIt.steps = res.steps;
        curTCIt.har = res.har;

        // determine test case iteration status - mark it as failed if any step has failed
        var failedSteps = _.find(res.steps, {_status: STATUS.FAILED});
        curTCIt._status = curTCRes._status = _.isEmpty(failedSteps) && !msg.error ? STATUS.PASSED : STATUS.FAILED;
        if (msg.error) {
            curTCIt.failure = GenerateFailureObject(msg.error);
        }
        // if any of test case iterations failed, mark the current test suite iteration as failed
        if (curTCIt._status === STATUS.FAILED) {
            curTSIt._status = STATUS.FAILED;
        }

        ee.emit('iteration-end', {
            status: curTCIt._status,
            failure: curTCIt.failure || null,
            case: {
                id: tc.id || null,
                name: tc.name,
                iteration: tcit,
                iterationCount: tc.iterationCount
            },
            suite: {
                id: ts.id || null,
                name: ts.name,
                iteration: tsit,
                iterationCount: ts.iterationCount
            }
        });

        // check if we are done with the current test case iterations
        // if we are done with current test case iterations, move to the next test case in the list
        tcit++;
        if (tcit > tc.iterationCount) {
            tcindex++;
            tcit = 1;
        }
        // check if we went through all the test cases
        if (tcindex >= ts.testcases.length) {
            tcindex = 0;
            tcit = 1;
            tsit++;
        }
        
        if (tsit > ts.iterationCount || _testKilled) {  // if we are done with test suite iterations
            finalizeTest(msg.error);
        } else {
            runTestCase();
        }
    }

    function finalizeTest(error) {
        // check if test wasn't killed before it was initialized and any results generated
        if (_testKilled) {
            if (!startTime) {
                _whenFinished.resolve(null);
                return;
            }
        }
        var moment = require('moment');
        // update test end time
        endTime = moment.utc();
        // calculate duration
        var duration = endTime - startTime; //endTime.unix() - startTime.unix();   // duration in seconds
        tr.summary._name = ts.name;
        tr.summary._startTime = _localTime ? startTime.local().format('YYYY-MM-DDTHH:mm:ss.SSS') : startTime.toISOString();
        tr.summary._endTime = _localTime ? endTime.local().format('YYYY-MM-DDTHH:mm:ss.SSS') : endTime.toISOString();
        tr.summary._duration = duration;
        tr.summary._status = STATUS.PASSED;
        tr.summary._totalCases = ts.testcases.length;
        tr.environment = _envVars;
        tr.capabilities = JSON.parse(JSON.stringify(_caps));    // assign a copy of _caps object
        tr.options = JSON.parse(JSON.stringify(_options));  // assign a copy of _options object

        // if error occured, add it to the summary
        if (error) {
            tr.summary.failure = GenerateFailureObject(error);
        }
        // determine test status
        _.each(tr.iterations, function(iteration) {
            if (iteration._status == STATUS.FAILED) {
                tr.summary._status = STATUS.FAILED;
            }
        });
        // save test results to a local variables before resetting class global variables
        var testResults = tr;
        _whenFinished.resolve(testResults);
        ee.emit('test-end', testResults);
    }

    function GenerateFailureObject(error) {
        if (!error) {
            return null;
        }
        var failure = new require('../model/stepfailure')();
        failure._message = error.message;
        failure._type = error.type ? error.type : 'INVALID_ERROR';
        failure._subtype = error.subtype;
        failure._line = error.line || null;
        failure._details = error.line ? 'at line ' + error.line : null;
        if (error.type) {
            failure._fatal = (error.type && _.includes(FATAL_ERROR_TYPES, error.type)).toString();
        } else {
            failure._fatal = 'true';
        }
        return failure;
    }

    return module;
};
