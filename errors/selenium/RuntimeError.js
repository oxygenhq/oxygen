/*
 * Selenium errors base class
 * Runtime sub types: ElementNotFound, ElementNotVisible, SessionNotCreatedException
 */ 
var OxygenError = require('../OxygenError');
var util = require('util');
util.inherits(RuntimeError, OxygenError);

function RuntimeError(err, cmd, args, opts, caps) {
	this._type = 'RuntimeError';
	this._subtype = err.seleniumStack ? err.seleniumStack.type : null;
	this._message = err.message;
	this._data = {};
	this._data.command = cmd;
	this._data.args = args;
	
	// add connection information if this is ECONNREFUSED 
	if (this._subtype === 'ECONNREFUSED') {
		if (opts.seleniumUrl) {
			this._message += ' ' + opts.seleniumUrl;
			this._data.seleniumUrl = opts.seleniumUrl;
		}
		else if (opts.host && opts.port) {
			this._message += ' ' + opts.host + ':' + opts.port;
			this._data.host = opts.host;
			this._data.port = opts.port;
		}
	}

	//SeleniumError.super_.call(this, null, caps, args);
	OxygenError.call(this);
}

module.exports = RuntimeError;