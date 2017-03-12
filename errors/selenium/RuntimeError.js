/*
 * Selenium errors base class
 * Runtime sub types: ElementNotFound, ElementNotVisible, SessionNotCreatedException
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(RuntimeError, OxygenError);

function RuntimeError(err, cmd, args, opts, caps) {
	this.type = 'RuntimeError';
	this.subtype = err.seleniumStack ? err.seleniumStack.type : null;
	this.message = err.message;
	this.data = {};
	this.data.command = cmd;
	this.data.args = args;
	
	// add connection information if this is ECONNREFUSED 
	if (this.subtype === 'ECONNREFUSED') {
		if (opts.seleniumUrl) {
			this.message += ' ' + opts.seleniumUrl;
			this.data.seleniumUrl = opts.seleniumUrl;
		}
		else if (opts.host && opts.port) {
			this.message += ' ' + opts.host + ':' + opts.port;
			this.data.host = opts.host;
			this.data.port = opts.port;
		}
	}

	//SeleniumError.super_.call(this, null, caps, args);
	OxygenError.call(this);
}

module.exports = RuntimeError;