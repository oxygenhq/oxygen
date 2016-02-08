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
	this._message = err.data ? getAppiumErrorMessage(err.data) : err.toString();
	this._dotnetStack = null;
	var self = this;
	
    this.__defineGetter__('toString', function(){
        if (this._type)
            return this._type + ': ' + this._message;
        return this._message;
    });
}
function getAppiumErrorMessage(data) {
    //console.log(JSON.stringify(data));
    if (data.status === '33') {
        if (data.value.origValue === 'Could not find a connected Android device.')
            return 'Could not find a connected Android device: ';
    }
    return data.value.message;
}

module.exports = AppiumError;