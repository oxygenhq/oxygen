var util         = require("util");
var EventEmitter = require("events").EventEmitter;
var moment       = require('moment');
var path		 = require('path');

var oxutil = module.exports.util = require('./util');

var Runner = module.exports.Runner = function () {
	var module = {};
    // inherit from EventEmitter
    var ee = {}; 
    util.inherits(ee, EventEmitter)
    // class variables
    var isRunning = false;
    var isInitializing = false;
    var childProc = null;
    var debugMode = false;
    var dbg = null;
    // define variables to iterate through test cases and test suite iterations
    var ts;
    var tcindex = 0;    // current test case index
    var tcit = 1;       // current test case iteration counter
    var tsit = 1;       // current test suite iteration counter
    var tr = null;      // current test results
    var startTime = null;
    var endTime = null;

    /*********************************
     * Public methods
     *********************************/
    module.init = function (args, debugPort) {
        isInitializing = true;
        // set up debugging port
        var forkExecArgv = { stdio: [ 'pipe', 'pipe', 'pipe' ], cwd: __dirname };
        if (debugPort)
        {
            debugMode = true;
            forkExecArgv = { execArgv: ['--debug-brk=' + debugPort] }
        }
        // start script-boilerplate in a separate thread
		//console.log(path.join(__dirname, 'script-boilerplate.js'));
        var fork = require('child_process').fork;
        childProc = fork(path.join(__dirname, 'script-boilerplate.js'), args, forkExecArgv);
		childProc.on('error', function (err) {
			console.error('error: ' + err);
		});
		childProc.on('disconnect', function (err) {
			//console.log('Child process disconnected');
		});
		childProc.on('exit', function (code, signal) {
			//console.log('Child process exited with code: ' + code + ', signal: ' + signal);
		});
        childProc.on('message', function (msg) {
            if (msg.event && msg.event === 'modules-loaded')
            {
                isInitializing = false;
                ee.emit("initialized", null);
            }
            else if (msg.event && msg.event === 'modules-failed')
                ee.emit('init-failed', msg.err);
            else if (msg.event && msg.event === 'execution-ended')
                processResultsAndRunTheNextIteration(msg);
            else if (msg.event && msg.event === 'modules-disposed')
                ee.emit('disposed', null);
        });
        // initialize debugger
        // apply the breakpoints and request continue
        if (debugMode)
        {
            var Debugger = require('./debugger');
            dbg = new Debugger(new EventEmitter());
            dbg.connect(debugPort);
            dbg.on('connected', function() {
                console.log('Debugger connected');
                //dbg.continue();
            });
            dbg.on('break', function(breakpoint) {
				//console.dir(breakpoint);
				dbg.continue();
                if (ts)
                    ee.emit('breakpoint', breakpoint, ts.testcases[tcindex]); 
                //console.log('Breakpoint at line: ' + breakpoint.body.sourceLine);
                if (breakpoint.body.sourceLine == 4)
                    dbg.continue();
            });
        }
    }
    
    module.dispose = function() {
        var msg = {
            type: 'dispose-modules'
        };
        childProc.send(msg);
    }

	module.run = function (testsuite) {
		if (isInitializing)
            throw new Error("Initialization hasn't been completed yet, wait for 'initialized' event");
        if (isRunning)
            throw new Error("Previous test is still running, wait for 'test-ended' event");
        isRunning = true;
        ts = testsuite;
        tr = new require('../model/testresult')();
        startTime = moment.utc();
        runTestCase();
	};
    
    module.debugContinue = function() {
        if (debugMode && dbg)
            dbg.continue();
    };
    module.on = ee.super_.prototype.on.bind(ee);
    ee.emit = ee.super_.prototype.emit.bind(ee);
    
    /*********************************
     * Private methods
     *********************************/
    function resetGlobalVariables()
    {
        tcindex = 0;    // current test case index
        tcit = 1;       // current test case iteration counter
        tsit = 1;       // current test suite iteration counter
        tr = null;      // current test results
        startTime = null;
        endTime = null;
        isRunning = false;
        isInitializing = false;
    }
    
    function runTestCase()
    {
		console.log('Start running test case');
        var tc = ts.testcases[tcindex];
        var scriptContent = tc.content;
        var params = null;
        // read next lines of parameters if parameter manager is defined
        if (tc.paramManager)
        {
            tc.paramManager.readNext();
            params = tc.paramManager.getValues();
        }
        var msg = {
            type: 'run-script',
            scriptName: tc.name,
            scriptPath: tc.path,
            scriptContent: tc.content,
            context : {
                params: params
            }
        };
        // add breakpoints before running the script if in debug mode
        if (debugMode && dbg && tc.breakpoints)
        {
            for (var i=0; i< tc.breakpoints.length; i++)
            {
                var line = tc.breakpoints[i];
                dbg.setBreakpoint(line, tc.name, null);
            }
        }
        childProc.send(msg);
    }
    function processResultsAndRunTheNextIteration(msg)
    {
        if (msg.error)
            ee.emit('test-error', msg.error);
        // clear all breakpoints if in debug mode
        if (debugMode && dbg)
            dbg.clearAll();
        var res = msg.results;

        var tc = ts.testcases[tcindex];
        // make sure testcase iterationCount is defined
        if (!tc.iterationCount)
            tc.iterationCount = 1;
        var curTSIt = null;
        if (tsit > tr.iterations.length)
            tr.iterations.push(curTSIt = new require('../model/tsiresult')());
        else
            curTSIt = tr.iterations[tsit-1];

        curTSIt.$.iterationNum = tsit;

        var curTCRes = null;
        if (curTSIt.testcases.length == tcindex + 1)
            curTCRes = curTSIt.testcases[tcindex];
        else
            curTSIt.testcases.push(curTCRes = require('../model/tcresult')());
        curTCRes.$.name = tc.name;

        var curTCIt = null;
        if (curTCRes.iterations.length == tcit)
            curTCIt = curTCRes.iterations[tcit - 1];
        else
            curTCRes.iterations.push(curTCIt = new require('../model/tciresult')());
        curTCIt.$.iterationNum = tcit;
        curTCIt.steps = res.steps;

        // check if we are done with the current test case iterations
        // if we are done with current test case iterations, move to the next test case in the list
        tcit++;
        if (tcit > tc.iterationCount)
        {
            tcindex++;
            tcit = 1;
        }
        // check if we went through all the test cases
        if (tcindex >= ts.testcases.length)
        {
            tcindex = 0;
            tcit = 1;
            tsit++;
        }
        // check if we are done with test suite iterations
        if (tsit > ts.iterationCount)
            finalizeTest();
        else
            runTestCase();
    }
    function finalizeTest()
    {
        var moment = require('moment');
        var fs = require('fs');
        // update test end time
        endTime = moment.utc();
        // calculate duration
        var duration = endTime.unix() - startTime.unix();   // duration in seconds
        tr.$.startTime = startTime.format();
        tr.$.endTime = endTime.format();
        tr.$.duration = duration;
        // save test results to a local variables before resetting class global variables
        var testResults = tr;
        resetGlobalVariables();
        ee.emit('test-ended', testResults);
    }

	return module;
};
// complete EventEmitter inheritance
//util.inherits(Runner, EventEmitter); //module.exports.Runner
