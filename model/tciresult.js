/*
 * Test Case Iteration Results
 */
module.exports = function () {
	return {
		_iterationNum: null,
		_retries: null,			// indicates how many times some error occured and the test case was restarted
		context: null,
		steps: null,  			// type of stepresult.js
		har: null
	};
};