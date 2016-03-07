/*
 * Test Case Step Results
 */
module.exports = function () {
	return {
        $: {
            name: null,
            status: null,
            duration: null,
            transaction: null,
            screenshotFile: null
        },
		failure: null,	// type of stepfailure.js
		screenshot: null, //{ _: null }
		stats: {}		// navigation timings or other statistics
	};
}