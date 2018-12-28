/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Sets the size of the outer browser window.
 * @function setWindowSize
 * @param {Number} width - Width in pixels.
 * @param {Number} height - Height in pixels.
 */
module.exports = function(width, height) {
    this.helpers.assertArgumentNumberNonNegative(width);
    this.helpers.assertArgumentNumberNonNegative(height);
    this.driver.setViewportSize({
        width: width,
        height: height
    }, false);
};
