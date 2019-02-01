/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.selectFrame('id=iFrame');//Selects a frame or an iframe within the current window.
 */
module.exports = function(frameLocator) {
    if (frameLocator === 'parent') {
        this.driver.frameParent();
    } else if (frameLocator === 'top') {
        this.driver.frame(null);
    } else if (!isNaN(frameLocator)) {
        this.driver.frame(frameLocator);
    } else {
        this.driver.frame(null);
        for (var i = 0; i < arguments.length; i++) {
            var locator = arguments[i];
            var el = this.driver.element(this.helpers.getWdioLocator(locator));
            this.driver.frame(el.value);
        }
    }
};
