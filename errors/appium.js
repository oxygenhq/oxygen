/*
 * NOTE: not used anywhere and requires non existent modules - therefore commented out for now.
 *
 * Appium errors representative class
 */ 
/*
var OxError = require('./oxerror');
var util = require('util');
util.inherits(AppiumError, OxError);

function AppiumError(err, caps, args) {
	AppiumError.super_.call(this);
    this.innerError = null;
	this.type = 'Appium';
	if (err.data)
		this.message = getAppiumErrorMessage(err.data);
	else if (err.cause)
		this.message = getAppiumErrorMessage(err.cause);
	else
		this.message = err.toString();
	this.caputeStackTrace();
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
*/