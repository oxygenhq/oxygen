/*
 * Appium errors representative class
 */ 
var OxError = require('./oxerror');
var util = require('util');
util.inherits(AppiumError, OxError);

function AppiumError(err, caps, args) {
    //console.log(JSON.stringify(arguments.callee.arguments));
	AppiumError.super_.call(this);
    this.innerError = null;
	this._type = 'Appium';
	if (err.data)
		this._message = getAppiumErrorMessage(err.data);
	else if (err.cause)
		this._message = getAppiumErrorMessage(err.cause);
	else
		this._message = err.toString();
	this.caputeStackTrace();
	/*this._dotnetStack = null;
	var self = this;
	
    this.__defineGetter__('toString', function(){
        if (this._type)
            return this._type + ': ' + this._message;
        return this._message;
    });*/
}
function getAppiumErrorMessage(data) {
	if (typeof data !== 'object')
		data = JSON.parse(data);
    if (data.status === '33') {
        if (data.value.origValue === 'Could not find a connected Android device.')
            return 'Could not find a connected Android device: ';
    }
	var msg = data.value.message;
	if (data.value.origValue)
		msg += ': ' + data.value.origValue;
    return msg;
}

module.exports = AppiumError;