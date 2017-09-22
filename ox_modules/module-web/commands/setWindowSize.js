/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Sets the size of the outer browser window.
 * @description To maximize the window set both width and height to 0.
 * @function setWindowSize
 * @param {Integer} width - Width in pixels.
 * @param {Integer} height - Height in pixels.
 */
module.exports = function(width, height) {
    this.helpers.assertArgumentNumberNonNegative(width);
    this.helpers.assertArgumentNumberNonNegative(height);
    this.driver.setViewportSize({
        width: width,
        height: height
    });
};
