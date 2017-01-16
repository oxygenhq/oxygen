/*
 * Selenium errors base class
 */ 
 
const DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND';
const SESSION_NOT_CREATED = 'SESSION_NOT_CREATED';
const ELEMENT_NOT_VISIBLE = 'ELEMENT_NOT_VISIBLE';

var OxygenError = require('./OxygenError');
var util = require('util');
util.inherits(SeleniumError, OxygenError);

function SeleniumError(err, cmd, args, opts, caps) {
	this._type = err.type;
	this._message = err.message;

	// get more detailed error if possible
	this._type = err.seleniumStack.type || this._type;
	if (err.seleniumStack && err.seleniumStack.type === 'SessionNotCreatedException') {
		if (err.seleniumStack.orgStatusMessage && err.seleniumStack.orgStatusMessage.indexOf('Could not find a connected Android device') > -1) {
			this._type = DEVICE_NOT_FOUND;
			this._message = 'Could not find a connected device';
			if (caps && (caps.deviceName || caps.udid)) {
				this._message += ': ' + (caps.deviceName || caps.udid);
			}
		}
		else {
			this._type = SESSION_NOT_CREATED;
		}
	}
	else if (err.seleniumStack && err.seleniumStack.type === 'ElementNotVisible') {
		this._type = ELEMENT_NOT_VISIBLE;
	}

	OxygenError.call(this, null, null, null);
}

module.exports = SeleniumError;