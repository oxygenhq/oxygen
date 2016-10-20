var child = require('child_process');
var _ = require('underscore');
var Oxygen = require('./oxygen').Runner;
var defer = require('when').defer;
var async = require("async");

function Launcher(testsuite, startupOpt, args) {
	var module = {};
	var _finished = defer();
	var _results = [];
	var _ts = testsuite;
	var _startupOpt = startupOpt;
	var _mode = startupOpt.mode;
	var _args = args || [];
	var _queue = null;
	
	/**
     * run sequence
     * @return  {Promise} that only gets resolves with either an exitCode or an error
     */
    module.run = function (capabilities) {
		_queue = async.queue(launchTest, _ts.parallel || 1);
		_queue.drain = endRun;
		_queue.error = endRun;
		
		// if no capabilities are specified, run single instance with default arguments
		if (!capabilities) {
			_queue.push(null);
		}
		else {
			_.each(capabilities, function(caps) {
				_queue.push(caps);
			});	
		}
				
		return _finished.promise;
	}
	
	/*********************************
     * Private methods
     *********************************/
	function launchTest(caps, callback) {
		var oxRunner = require('./oxygen').Runner();
		oxRunner.init(startupOpt)
		.then(function() {
			return oxRunner.run(_ts, null, caps);
		})
		.then(function(tr) {
			tr.caps = caps;
			_results.push(tr);
			callback();
			return oxRunner.dispose();
		})
		.catch(function(e) {
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
				callback(e);	// call back with the original exception
			
			return oxRunner.dispose();
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
	
	return module;
}

module.exports = Launcher;