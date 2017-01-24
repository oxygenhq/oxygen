/**
 * @summary Performs a swipe.
 * @function swipe
 * @param {String} locator - Element locator. "id=" to search by ID or "//" to search by XPath.
 * @param {Integer} startx - Horizontal offset.
 * @param {Integer} starty - Vertical offset.
 * @param {Integer} speed - Time (in milliseconds) to spend performing the swipe.
 * @return {}
*/
var swipe = function(locator, xoffset, yoffset, speed) {
    speed = typeof speed === 'number' ? speed : 100;
    if (arguments.length === 2 && typeof selector === 'number' && typeof xoffset === 'number') {
        xoffset = locator;
        yoffset = xoffset;
        locator = null;
    }
	if (locator != null) {
		var elm = null;
		if (typeof locator === 'object') {
			elm = locator;
		}
		else {
			elm = this._module.findElement(locator);
		}

		return elm.swipe(xoffset, yoffset, speed);
	}
	return this._driver.swipe(xoffset, yoffset, speed);
};

module.exports = swipe;