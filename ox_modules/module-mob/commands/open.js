/**
 * @summary Opens an URL.
 * @function open
 * @param {String} url - The URL to open.
 */
module.exports = function(url) {
	return this._driver.url(url);
};

