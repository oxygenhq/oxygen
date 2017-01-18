/**
     * @summary Performance tap action on a hidden element.
     * @function tapHidden
	 * @param {String} locator - Locator of element to be found. "id=" to search by ID or "//" to search by XPath.
*/
module.exports = function(locator) {
	if (!locator) 
		throw new Error('locator is empty or not specified');
	
	if (!this._module.isWebViewContext())
		throw new Error("Not in WEB_VIEW context. This method works only with WEB_VIEW context.")
	locator = this._helpers.getWdioLocator(locator);
	var elm = this._module.findElement(locator);
	if (!elm) {
		var error = new Error('ElementNotFound');
		error.type = 'ElementNotFound';
		throw error;
	}
	var size = elm.getElementSize();
	var location = elm.getLocation();
	var height = size.height;
    var width = size.width;
	var x = location.x;
	var y = location.y;
	
	// get absolute element position
	var rect = this._driver.selectorExecute(
		locator,
		function(elms) {
			var elm = elms && elms.length > 0 ? elms[0] : null;
			if (!elm) {
				return null;
			}
			return elm.getBoundingClientRect();
		}
	);
	// tap in the middle of the element
	var targetX = rect.left + (rect.width / 2);
	var targetY = rect.top + (rect.eight / 2);
	console.dir(rect);
	// switch to NATIVE context
	this._module.setNativeContext();
	this._module.pause(5000);
	var selector = 'android=new UiSelector().className("android.webkit.WebView")';
	var webviewElm = this._module.findElement(selector);
	console.dir(webviewElm);
	/*this._driver.performTouchAction([{
		element: webviewElm.value.ELEMENT, x: 450, y: 550
	}]);*/
	//this._driver.execute('document.elementFromPoint(' + targetX + ', ' + targetY + ').click();');
	//this._driver.execute('console.log("' + targetX + ' - ' + targetY + '");');
	elm.touchPerform([{
		action: 'tap',
		element: webviewElm.value.ELEMENT,
		options: {
			x: targetX,
			y: targetY
		}
	}]);
	// return back to WEB_VIEW context
	this._module.setWebViewContext();
	/*this._driver.touchAction({
    	actions: 'tap', x: targetX, y: targetY
    });*/
};

