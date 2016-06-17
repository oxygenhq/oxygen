/*
 * Test Case Step Results
 */
module.exports = function () {
	return {
        _name: null,
        _status: null,
        _duration: null,
        _transaction: null,
		_action: null, 	// true / false
		_screenshotFile: null,
		failure: null,	// type of stepfailure.js
		screenshot: null, //{ _: null }
		stats: null		// navigation timings or other performance statistics
	};
};