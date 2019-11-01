/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Selects a frame or an iframe within the current window.
 * @description Available frame locators:  
 *              - `'parent'` - Select parent frame.  
 *              - `'top'` - Select top window.  
 *              - `NUMBER` - Select frame by its 0-based index.  
 *              - `LOCATOR` - Locator identifying the frame (relative to the top window).
 *              Multiple locators can be passed in order to switch between nested frames.
 * @function selectFrame
 * @param {...String|Number} frameLocator - A locator identifying the frame or iframe. Or a series 
 *         of locators.
 * @for hybrid, web
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.selectFrame("//iframe[@id='frame1']", "//iframe[@id='nested_frame']");
 */
module.exports = function(frameLocator) {
    if (frameLocator === 'parent') {                // parent
        this.driver.switchToParentFrame();
    } else if (frameLocator === 'top') {            // top
        this.driver.switchToFrame(null);
    } else if (!isNaN(frameLocator)) {              // frame index
        this.driver.switchToFrame(frameLocator);
    } else {                                        // frame locator(s)
        this.driver.switchToFrame(null);
        for (var i = 0; i < arguments.length; i++) {
            var locator = arguments[i];
            var el = this.helpers.getElement(locator);
            this.driver.switchToFrame(el);
        }
    }
};
