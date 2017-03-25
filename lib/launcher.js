var _ = require('underscore');
var defer = require('when').defer;
var async = require('async');

function Launcher(testsuite, startupOpt) {
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
    };
    
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
    
    return module;
}

module.exports = Launcher;