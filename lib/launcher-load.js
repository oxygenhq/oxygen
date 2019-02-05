/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const _ = require('lodash');
const defer = require('when').defer;
const async = require('async');

const ParameterManager = require('./param-manager');

function LoadLauncher(testsuite, startupOpt) {
    var module = {};
    var _finished = defer();
    var _results = [];
    var _ts = testsuite;
    var _queue = null;

    /**
     * run sequence
     * @return  {Promise} that only gets resolves with either an exitCode or an error
     */
    module.run = function (capabilities) {
		const totalConcurrent = _.sumBy(_ts.testcases, 'parallel');
        _queue = async.queue(launchTest, totalConcurrent);
        _queue.drain = endRun;
        _queue.error = endRun;
        // make sure to take only first capabilities list (capabilities might be either an array on a single object)
        if (Array.isArray(capabilities)) {
            if (capabilities.length > 0) {
                capabilities = capabilities[0]
            }
            else {
                capabilities = null;
            }
        }
        // if test has parameters (e.g. _ts.paramManager is not null)
        // then divide all rows equally between test cases so each gets a unique set of rows
        var testDataChunks = null;
        if (_ts.paramManager && _ts.paramManager.table && _ts.paramManager.table.length >= totalConcurrent) {
            var orgTestData = _ts.paramManager.table;
            var chunkSize = Math.floor(_ts.paramManager.rows / _ts.testcases.length);            
            var currentChunkPos = 0;
            testDataChunks = [];
            for (var i=0; i< _ts.testcases.length; i++) {
                testDataChunks.push(orgTestData.slice(currentChunkPos, currentChunkPos + chunkSize));
                currentChunkPos += chunkSize;
            }
            testdata = _ts.paramManager.table;
        }
        for (var tc of _ts.testcases) {            
            // both interval and delay are in seconds
            var interval = 0;
            var delay = 0;
            if (tc.rampup > 0) {
                interval = tc.rampup / tc.parallel;
            }
            const tcIndex = _ts.testcases.indexOf(tc);
            const testDataPerCase = testDataChunks ? testDataChunks[tcIndex] : null;
            var chunkSize = 0; 
            var currentChunkPos = 0;
            // allocate unique test data for each parallel thread
            if (testDataPerCase && testDataPerCase.length >= tc.parallel) {
                chunkSize = Math.floor(testDataPerCase.length / tc.parallel)
            }
            // make sure we allocate a unique data set for this test case, if any test data was specified
            for (var i=0; i < tc.parallel; i++) {
                const testDataPerThread = testDataPerCase ? testDataPerCase.slice(currentChunkPos, currentChunkPos + chunkSize) : null;
                currentChunkPos += chunkSize;
                setTimeout(
                    function(test) {
                        _queue.push(test);
                    }, 
                    delay * 1000, 
                    { thread: i + 1, testcase: tc, caps: capabilities, testdata: testDataPerThread }
                );
                delay += interval;
            }
        }

        return _finished.promise;
    };

    /*********************************
     * Private methods
     *********************************/
    function launchTest(params, callback) {    
        const { testcase, testdata, caps, thread } = params;
        var oxRunner = new require('./oxygen').Runner();
        // adjust startup options to include information from capabilities
        addCapabilitiesToStartupOptions(startupOpt, caps);
        // if iterationCount == 0 and duration is defined, then run the test case until duration is reached
        const iterationCount = testcase.iterationCount == 0 && testcase.maxDuration ? 99999 : testcase.iterationCount;
        // init param manager if test data provided
        var paramManager = null;
        if (testdata) {
            paramManager = new ParameterManager();
            paramManager.initFromObject(testdata, 'seq');
        }
        // mockup test suite with a single test case to run
        const suite = {
            name: thread, // specify thread number and pass it later to CSV file to allow better analysis in Excel
            iterationCount: 1,
            paramManager: paramManager,
            testcases: [{
                ...testcase, iterationCount: iterationCount 
            }]
        }
        // initialize oxygen
        oxRunner.init(startupOpt)
        .then(function() {
            return oxRunner.run(suite, null, caps);
        })
        .then(function(tr) {
            _results.push(tr);
            oxRunner.dispose().then(function() {
                // first dispose the oxygen object then call to finish callback
                callback();
            }).catch(function(err) {
                callback(err);
            });
        })
        .catch(function(e) {
            // dispose oxygen first
            oxRunner.dispose().then(function() {
                // stop processing the queue
                _queue.kill();
                // if this is custom error message
                if (e.error) {
                    var errMsg = '';
                    var err = e.error;
                    if (err.type)
                        errMsg += err.type + ' - ';
                    if (err.message)
                        errMsg += err.message;
                    else
                        errMsg = err.toString();
                    callback(new Error(errMsg));
                }
                else
                    callback(e);    // call back with the original exception
            }).catch(function(err) {
                // stop processing the queue
                _queue.kill();
                // report error
                callback(err);
            });
        });
    }

    function endRun(fatalError) {
        if (fatalError) {
            _finished.reject(fatalError);
        }
        else {
            _finished.resolve(_results);
        }

    }
    /*
     * Adds capabilities to startup option, overriding the options
     */
    function addCapabilitiesToStartupOptions(options, caps) {
        if (!caps)
            return;
        if (caps.browserName)
            options.browserName = caps.browserName;
        if (caps.platformName)
            options.platformName = caps.platformName;
        if (caps.platformVersion)
            options.platformVersion = caps.platformVersion;
        if (caps.deviceName)
            options.deviceName = caps.deviceName;
        if (caps.applicationName)
            options.applicationName = caps.applicationName;
    }

    return module;
}

module.exports = LoadLauncher;
