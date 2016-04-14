// load configurations
var config = require('config');
var useFiber = config.get('useFiber');
// setup logger
var loggerFactory = require('oxygen-logger');
loggerFactory.init(config.get('logger'));
var logger = loggerFactory.get('oxygen');

// modules and Classes used in this module
var util         = require("util");
var EventEmitter = require("events").EventEmitter;
var moment       = require('moment');
var path         = require('path');
var TestResult      = require('../model/testresult');

var oxutil = module.exports.util = require('./util');

module.exports.model = {};
// oxygen public models and other objects 
module.exports.model.TestCase = require('../model/testcase.js');
module.exports.model.TestSuite = require('../model/testsuite.js');
module.exports.ParameterManager = require('./param-manager.js');

var Runner = module.exports.Runner = function () {
    var self = this;
    var defer = require('when').defer;
    var module = {};
    // inherit from EventEmitter
    var ee = {}; 
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
	var _envVars = null;	// environment variables passed at the beginning of the test
    // promises
    var _whenDisposed = defer();
    var _whenFinished = defer();
    var _whenInitialized = defer();
    /*********************************
     * Public methods
     *********************************/
    module.init = function (args, debugPort) {
        _isInitializing = true;
        // set up debugging port
        var forkExecArgv = { cwd: __dirname };
        if (debugPort) {
            debugMode = true;
            forkExecArgv = { execArgv: ['--debug-brk=' + debugPort] };
        }
        // apply configuration settings
        args.push('--useFiber=' + useFiber);
        args.push('--scriptContentLineOffset=' + module.getScriptContentLineOffset());
        
        // start script-boilerplate in a separate thread
        var fork = require('child_process').fork;
        childProc = fork(path.join(__dirname, 'script-boilerplate.js'), args, forkExecArgv);
        // hook all events of the child process
        hookChildProcEvents(childProc);
        // initialize debugger
        // apply the breakpoints and request continue
        if (debugMode) {
            initializeDebugger(debugPort);
        }
            
        return _whenInitialized.promise;
    };
    
    module.dispose = function() {
        _isDisposing = true;
        if (dbg) {
            dbg.disconnect().then(function() {
                var msg = {
                    type: 'dispose-modules'
                };
                childProc.send(msg);    
            });
        }
        else {
            var msg = {
                type: 'dispose-modules'
            };
            childProc.send(msg);    
        }        
        return _whenDisposed.promise;
    };

    module.run = function (testsuite, envVars) {
        if (_isInitializing) {
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        }
        if (_isRunning) {
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        }
        _isRunning = true;
		_envVars = envVars;	// assign environment variables for later use
        ts = testsuite;
        tr = new require('../model/testresult')();
        startTime = moment.utc();
        runTestCase();
        
        return _whenFinished.promise;
    };
    
    module.kill = function () {
        if (childProc) {
            childProc.kill();
        }
        resetGlobalVariables();
    };
    
    module.debugContinue = function() {
        if (debugMode && dbg) {
            dbg.continue();
        }
    };
    
    module.setBreakpoint = function(line) {
        if (debugMode && dbg && ts && ts.testcases) {
            var tc = ts.testcases[tcindex];
            logger.debug('oxygen.setBreakpoint: ' + line + module.getScriptContentLineOffset());
            dbg.setBreakpoint(line + module.getScriptContentLineOffset(), tc.name, null);
        }
    };
    
    module.clearBreakpoint = function(line) {
        if (debugMode && dbg) {
            dbg.clearBreakpoint(line + module.getScriptContentLineOffset(), null);
        }
    };
    
    module.getScriptContentLineOffset = function() {
        // NOTE: needs to be update on any changes to the script wrapper in script-boilerplate
        return useFiber ? 3 : 2;
    };

    module.on = ee.super_.prototype.on.bind(ee);
    ee.emit = ee.super_.prototype.emit.bind(ee);
    
    /*********************************
     * Private methods
     *********************************/
    function hookChildProcEvents() {
        childProc.on('error', function (err) {
            logger.error('error: ' + err);
            _childProcLastError = err;
        });
        childProc.on('disconnect', function (err) {
            //logger.debug('script-boilerplate process disconnected');
        });
        childProc.on('uncaughtException', function (err) {
            logger.error((err && err.stack) ? err.stack : err);
            _childProcLastError = err;
        }); 
        childProc.on('exit', function (code, signal) {
            logger.debug('script-boilerplate process exited with code: ' + code + ', signal: ' + signal);
            if (dbg) {
                dbg.disconnect();
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
            } else if (msg.event && msg.event === 'ui-log-add') { // IDE log panel. event from module-log.
                ee.emit('ui-log-add', msg.level, msg.msg);
            } else if (msg.event && msg.event === 'modules-loaded') {
                _isInitializing = false;
                _whenInitialized.resolve(null);
            } else if (msg.event && msg.event === 'modules-failed') {
                _isInitializing = false;
                _whenInitialized.reject(msg.err);
            } else if (msg.event && msg.event === 'execution-ended') {
                processResultsAndRunTheNextIteration(msg);
            } else if (msg.event && msg.event === 'modules-disposed') {
                _whenDisposed.resolve(null);
            } else if (msg.event && msg.event === 'line-update') {
                ee.emit('line-update', msg.line);
            }
        });
    }
    function initializeDebugger(debugPort) {
        var Debugger = require('./debugger');
        dbg = new Debugger(new EventEmitter());
        dbg.connect(debugPort);
        dbg.on('error', function(err) {
            logger.error('Debugger error', err);
        });
        dbg.on('break', function(breakpoint) {
            logger.debug('stopped at breakpoint: ' + JSON.stringify(breakpoint));
            // sometimes it breaks inside script-boilerplate, most likely due to initial break 
            // just occuring at random point. thus we ignore that bp.
            if (breakpoint.body.sourceLine < module.getScriptContentLineOffset() ||
                breakpoint.body.script.name.endsWith("script-boilerplate.js")) {
                dbg.continue();
                return;
            } 
            
            if (ts) {
                ee.emit('breakpoint', breakpoint, ts.testcases[tcindex]); 
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
        _isRunning = false;
        _isInitializing = false;
    }
    
    function runTestCase() {
        ee.emit('iteration-start', tcit);
        var tc = ts.testcases[tcindex];
        var scriptContent = tc.content;
        var params = null;
        // read next lines of parameters if parameter manager is defined
        if (tc.paramManager) {
            tc.paramManager.readNext();
            params = tc.paramManager.getValues();
        }
        var msg = {
            type: 'run-script',
            scriptName: tc.name,
            scriptPath: tc.path,
            scriptContent: tc.content,
            context : {
                params: params,
				env: _envVars
            }
        };
        // add breakpoints before running the script if in debug mode
        if (debugMode && dbg && tc.breakpoints) {
            for (var i=0; i< tc.breakpoints.length; i++) {
                // editor index starts from 1, but we need zero based index
                var line = tc.breakpoints[i] - 1;
                logger.debug('oxygen set initial bps: ' + module.getScriptContentLineOffset() + line);
                dbg.setBreakpoint(module.getScriptContentLineOffset() + line, tc.name, null);
            }
        }
        childProc.send(msg);
    }
    
    function processResultsAndRunTheNextIteration(msg) {
        if (msg.error) {
            ee.emit('test-error', msg.error);
        }
        // clear all breakpoints if in debug mode
        if (debugMode && dbg) {
            dbg.clearAll();
        }
        var res = msg.results;

        var tc = ts.testcases[tcindex];
        // make sure testcase iterationCount is defined
        if (!tc.iterationCount) {
            tc.iterationCount = 1;
        }
        var curTSIt = null;
        if (tsit > tr.iterations.length) {
            tr.iterations.push(curTSIt = new require('../model/tsiresult')());
        } else {
            curTSIt = tr.iterations[tsit-1];
        }

        curTSIt._iterationNum = tsit;

        var curTCRes = null;
        if (curTSIt.testcases.length == tcindex + 1) {
            curTCRes = curTSIt.testcases[tcindex];
        } else {
            curTSIt.testcases.push(curTCRes = require('../model/tcresult')());
        }
        curTCRes._name = tc.name;

        var curTCIt = null;
        if (curTCRes.iterations.length == tcit) {
            curTCIt = curTCRes.iterations[tcit - 1];
        } else {
            curTCRes.iterations.push(curTCIt = new require('../model/tciresult')());
        }
        curTCIt._iterationNum = tcit;
        curTCIt.steps = res.steps;
        curTCIt.har = res.har;

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
        // check if we are done with test suite iterations
        if (tsit > ts.iterationCount) {
            finalizeTest();
        } else {
            runTestCase();
        }
    }
    
    function finalizeTest() {
        var moment = require('moment');
        var fs = require('fs');
        // update test end time
        endTime = moment.utc();
        // calculate duration
        var duration = endTime.unix() - startTime.unix();   // duration in seconds
        tr.summary._name = ts.name;
        tr.summary._startTime = startTime.toISOString();
        tr.summary._endTime = endTime.toISOString();
        tr.summary._duration = duration;
        // save test results to a local variables before resetting class global variables
        var testResults = tr;
        resetGlobalVariables();
        
        _whenFinished.resolve(testResults);
        //ee.emit('test-ended', testResults);
    }

    return module;
};