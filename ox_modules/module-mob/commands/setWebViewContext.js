/**
     * @summary Finds element.
     * @function findElement
	 * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
*/
module.exports = function() {
	var response = this._driver.contexts();
	var contexts = response.value;
	this.sessionId = response.sessionId;
 	// select first available WEBVIEW context
	for (var i=0; i<contexts.length; i++) {
		var context = contexts[i];
		if (context && (context.indexOf('WEBVIEW') > -1 || context.indexOf("CHROMIUM") > -1)) {
			this.logger.debug('Setting context: ' + context);
			this._driver.context(context);
			return context;
		}
	}
};

