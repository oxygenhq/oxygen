/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Finds an element.
 * @function findElement
 * @param {String} locator - Element locator.
 * @param {Object=} parent - Optional parent element for relative search.
 * @return {WebElement} - A WebElement object.
 * @example <caption>[javascript] Usage example</caption>
 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
 * mob.findElement("id=Password","id=divPass");//Finds an element.
*/
module.exports = function(locator, parent) {
    this.helpers.assertArgument(locator, 'locator');
    locator = this.helpers.getWdioLocator(locator);

    let elm = null;
    if (parent && typeof parent === 'object' && parent.$) {
        elm = parent.$(locator);
    } else {
        elm = this.driver.$(locator);
    }
    return elm;
};
