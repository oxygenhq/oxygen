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
            harFile: null,
            screenshotFile: null
        },
		failure: {
            $: {
                type: null,
                message: null,
                details: null
            }
        },
		
		har: { _: null },
		screenshot: { _: null }
	};
}