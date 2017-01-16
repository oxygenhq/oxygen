/**
     * @summary Clicks on a widget.
     * @function open
     * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} wait - Time in seconds to wait for the widget.
     * @param {Integer} pollrate - Time in seconds between polling intervals.
     */
module.exports = function(url) {
	return this._driver.url(url);
};

