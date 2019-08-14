/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Drag and Drop element into another element
 * @function dragAndDrop
 * @param {String} srcElement - Element to drag and drop.
 * @param {String} dstElement - Destination element to drop into.
 * @example <caption>[javascript] Usage example. Drops grey rectangle into red square.</caption>
 * web.init();
 * web.open('http://webdriverjs.christian-bromann.com/');
 * web.dragAndDrop('id=overlay', '/html/body/section/div[1]');
 * web.pause(10*1000);
 */
module.exports = function(srcElement, dstElement) {
    this.helpers.assertArgument(srcElement, 'srcElement');
    this.helpers.assertArgument(dstElement, 'dstElement');

    this.driver.dragAndDrop(
        this.helpers.getWdioLocator(srcElement),
        this.helpers.getWdioLocator(dstElement));
};
