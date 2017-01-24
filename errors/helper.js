/**
 * Helper module to handle and convert various error types
 */
var SeleniumError = require('../errors/SeleniumError');
var WaitTimeoutError = require('../errors/selenium/WaitTimeoutError');
var RuntimeError = require('../errors/selenium/RuntimeError');
var ElementNotFoundError = require('../errors/selenium/ElementNotFoundError');
var ElementNotVisibleError = require('../errors/selenium/ElementNotVisibleError');
var OxygenError = require('../errors/OxygenError');
var AssertionError = require('../errors/AssertionError');

var self = module.exports = {
	getOxygenError: function(err, cmd, args, opts, caps) {
		var errType = err.type || err.name || typeof err;

		if (errType === 'RuntimeError') {
			if (err.seleniumStack) {
				return new SeleniumError(err, cmd, args, opts, caps);
			}	
		}
		
		// wrap the thrown error with one of pre-defined Oxygen error types
		switch (errType) {
			case "WaitUntilTimeoutError": 
				return new WaitTimeoutError(err, cmd, args, opts, caps);
			case "RuntimeError": 
				return new RuntimeError(err, cmd, args, opts, caps);
			case "AssertionError": 
				return new AssertionError(err, cmd, args, opts, caps);
			case "ElementNotVisible":
				return new ElementNotVisibleError(err, cmd, args, opts, caps);
			case "ElementNotFound":
				return new ElementNotFoundError(err, cmd, args, opts, caps);
			default:
				return new OxygenError(err.type, err.message, null);
		}
	}
};