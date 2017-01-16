/**
     * @summary Performs a swipe.
     * @function swipe
	 * @param {String} locator - Widget locator. "id=" to search by ID or "//" to search by XPath.
     * @param {Integer} startx - Horizontal offset.
     * @param {Integer} starty - Vertical offset.
     * @param {Integer} speed - Time (in milliseconds) to spend performing the swipe
*/
var scrollToElement = function(containerLocator, elmLocator, direction) {
    if (!direction) {
        direction = 'vertical';
    }
    // calculate height to scroll
    var containerElm = this._module.findElement(containerLocator);
    var containerHeight = containerElm.getSize().height;
    var containerWidth = containerElm.getSize().width;
    var defaultOffset = 200;
    var defaultSpeed = 500;
    var xposition = 0;
    var yposition = 0;
    var found = false;
    console.log('width: ' + containerWidth + ', height: ' + containerHeight);
	var targetElm = this._module.findElement(elmLocator);
	var yoffset = Math.floor(targetElm.getLocation().y);
	console.log('yoffset: ' + yoffset);
	containerElm.flick(0, yoffset * -1, defaultSpeed);
/*
    while (true) {
        if (xposition >= containerWidth)
            break;
        else if (yposition >= containerHeight)
            break;
        try {
            var elm = this._module.findElement(elmLocator);
			console.dir(elm.getLocation());
			if (elm.isDisplayed())
				return true;
        }
        catch (e) {
            console.log('tried to scroll, element not found');
            console.log('yposition: ' + yposition + ', xposition: ' + xposition);
        }
        
        if (direction === 'vertical') {
            yposition += defaultOffset;
            try {
                containerElm.flick(0, yposition * -1, defaultSpeed);
            }
            catch(e) { 
                console.dir(e);
                return false; 
            }
        }
        else if (direction === 'horizontal') {
            xposition += defaultOffset;
            try {
                containerElm.flick(defaultOffset, 0, defaultSpeed);
            }
            catch(e) { 
                console.dir(e);
                return false; 
            }
            
        }        
        //this._module.pause(100);
    }*/
    return found;
};

module.exports = scrollToElement;