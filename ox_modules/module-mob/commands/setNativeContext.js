/**
 * @summary Sets context to NATIVE_APP.
 * @function setNativeContext
*/
module.exports = function() {
	this._driver.context('NATIVE_APP');
	this._context = 'NATIVE_APP';
};

