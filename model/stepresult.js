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
		failure: {
            $: {
                type: null,
                message: null,
                details: null
            }
        },
		screenshot: { _: null }
	};
}