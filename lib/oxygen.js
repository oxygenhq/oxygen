// load configurations
var config = require('config');
var useFiber = config.get('useFiber');
var allowRequire = config.get('allowRequire') || false;
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
const STATUS = require('../model/status.js');
var _ = require('underscore');
// define fatal error types
const FATAL_ERROR_TYPES = [
	"SCRIPT_ERROR",
	"NAVIGATE_TIMEOUT"
];
const RETRY_ERROR_TYPES = [
	"NAVIGATE_TIMEOUT"
];
const MAX_RETRIES = 2;

var oxutil = module.exports.util = require('./util');

module.exports.model = {};
// oxygen public models and other objects 
module.exports.model.TestCase = require('../model/testcase.js');
module.exports.model.TestSuite = require('../model/testsuite.js');
module.exports.STATUS = require('../model/status.js');
module.exports.ParameterManager = require('./param-manager.js');
module.exports.ReporterXLSX = require('./reporters/excel-reporter.js');

var Runner = module.exports.Runner = function () {
    var self = this;
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
	var _mode = 'web';
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
	var _retries = 0;
	var _envVars = {};	// environment variables passed at the beginning of the test
	var _vars = {};		// user-defined variables that are shared between different scripts
	var _caps = {};	// desired capabilities that are passed to each module
	var _options = null;
	var _lastResultUpdate = null;
	var _testKilled = false;
    // promises
    var _whenDisposed = defer();
    var _whenFinished = defer();
    var _whenInitialized = defer();
    /*********************************
     * Public methods
     *********************************/
    module.init = function (options) { /*args, mode, debugPort*/
        _isInitializing = true;
		_options = options;
        // set up debugging port
        var forkExecArgv = { cwd: __dirname };
        if (options.debugPort) {
            debugMode = true;
            forkExecArgv = { execArgv: ['--debug-brk=' + options.debugPort] };
        }
		if (options.mode && options.mode === 'mob')
			_mode = 'mob';
		else
			_mode = 'web';
		// allowRequire determines if 'require' is allowed inside the test script
		options.allowRequire = allowRequire;
        // apply configuration settings
		// Fiber must be used in mobile mode but can't be used in web mode due to .NET interop issue
		// so if Fiber is used, .NET dispatcher must not be loaded
		if (_mode !== 'mob') {
			options.useFiber = useFiber;
			options.mode = "web";
		}
		else {
			options.useFiber = true;
			options.initDotNetDispatcher = false;
			options.mode = "mob";
		}
        options.scriptContentLineOffset = module.getScriptContentLineOffset();
        
        // fork script-boilerplate
        var fork = require('child_process').fork;
        childProc = fork(path.join(__dirname, 'script-boilerplate.js'), forkExecArgv);
		
        hookChildProcEvents(childProc);
		
        if (debugMode) {
			// script-boilerplate initialization will be started separately in the debugging mode
            initializeDebugger(options.debugPort, childProc, options);
        }
		else {
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
				dbg.disconnect();
			}
			resetGlobalVariables();
			_whenDisposed.resolve(null);
		}
		else {
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
		_envVars = envVars || {};	// assign environment variables for later use
		_caps = caps || {};	// assign caps for later use
        ts = testsuite;
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
            logger.debug('oxygen.setBreakpoint: ' + (line + module.getScriptContentLineOffset()));
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
		var lineOffset = _options.useFiber ? 3 : 2;
		if (debugMode) {
			lineOffset + 2;
		}
        return lineOffset;
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
            logger.debug('script-boilerplate process disconnected');
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
            } else if (msg.event && msg.event === 'result-update') {
				logger.debug('Calling: ' + msg.module + '.' + msg.method + ' with arguments: ' + JSON.stringify(msg.args));
				ee.emit('line-update', msg.line);
                ee.emit('result-update', msg);
				_lastResultUpdate = msg;
            }
        });
    }
    
    function initializeDebugger(debugPort, childProc, options) {
        var Debugger = require('./debugger');
        dbg = new Debugger(new EventEmitter());
        dbg.connect(debugPort);
        dbg.on('connected', function(err) {
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
        var scriptContent = tc.content;
        var params = null;
        // read next lines of parameters if parameter manager is defined
        if (tc.paramManager) {
            params = tc.paramManager.getValues();
            tc.paramManager.readNext();
        }
        var msg = {
            type: 'run-script',
            scriptName: tc.name,
            scriptPath: tc.path,
            scriptContent: tc.content,
            context : {
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
            for (var i=0; i< tc.breakpoints.length; i++) {
                // editor index starts from 1, but we need zero based index
                var line = tc.breakpoints[i] - 1;
                logger.debug('oxygen set initial bps: ' + (module.getScriptContentLineOffset() + line));
                dbg.setBreakpoint(module.getScriptContentLineOffset() + line, tc.name, null);
            }
        }
        childProc.send(msg);
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
            dbg.clearAll();
        }
		// check if the current iteration shall be restarted due to particular error type (mostly driver timeout related errors)
		if (msg.error && msg.error.type && _.contains(RETRY_ERROR_TYPES, msg.error.type) && _retries < MAX_RETRIES) {
			_retries++;
			runTestCase();
			return;
		}
		
		// store 'vars' part of the context for a later use
		_vars = msg.context.vars || {};
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
        curTCRes._name = tc.name;

        var curTCIt = null;
        if (curTCRes.iterations.length == tcit) {
            curTCIt = curTCRes.iterations[tcit - 1];
        } else {
            curTCRes.iterations.push(curTCIt = new require('../model/tciresult')());
        }
        curTCIt._iterationNum = tcit;
		curTCIt.context = msg.context;
        curTCIt.steps = res.steps;
        curTCIt.har = res.har;
		// set retries counter - indicates how many times some error occured and the test case was restarted
		curTCIt._retries = _retries;
		
		// reset the _retries counter
		_retries = 0;

		// determine test case iteration status - mark it as failed if any step has failed
		var failedSteps = _.findWhere(res.steps, {_status: STATUS.FAILED});
		curTCIt._status = _.isEmpty(failedSteps) ? STATUS.PASSED : STATUS.FAILED;
		// if any of test case iterations failed, mark the current test suite iteration as failed
		if (curTCIt._status === STATUS.FAILED) {
			curTSIt._status = STATUS.FAILED;
		}

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
		// if SCRIPT_ERROR error was received, then stop further test execution
		if (msg.error && msg.error.type && _.contains(FATAL_ERROR_TYPES, msg.error.type)) {
			finalizeTest(msg.error);
		}
        // check if we are done with test suite iterations
        else if (tsit > ts.iterationCount || _testKilled) {
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
        var fs = require('fs');
        // update test end time
        endTime = moment.utc();
        // calculate duration
        var duration = endTime.unix() - startTime.unix();   // duration in seconds
        tr.summary._name = ts.name;
        tr.summary._startTime = startTime.toISOString();
        tr.summary._endTime = endTime.toISOString();
        tr.summary._duration = duration;
		tr.summary._status = STATUS.PASSED;
		// if error occured, add it to the summary
		if (error) {
			var failure = new require('../model/stepfailure')();
			failure._message = error.message;
			failure._type = error.type;
			failure._line = error.line || null;
			failure._details = error.line ? 'at line ' + error.line : null;	
			failure._fatal = (error.type && _.contains(FATAL_ERROR_TYPES, error.type)).toString();
			tr.summary.failure = failure;
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
        //ee.emit('test-ended', testResults);
    }

    return module;
};