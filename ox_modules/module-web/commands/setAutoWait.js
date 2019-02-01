/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Specifies whether commands should automatically wait till element appears in the DOM and
 *          becomes visible, before executing.
 * @description By default automatic waiting is enabled. This setting affects all commands which 
 *              expect to perform some action on elements, except `wait*`, `assert*`, `is*` and 
 *              other commands which receive optional timeout parameter.
 * @function setAutoWait
 * @param {Boolean} enable - true to enable automatic waiting, false to disable.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.setAutoWait(‘enable’);//Enables/disables auto wait to element in DOM
 */
module.exports = function(enable) {
    this.helpers.assertArgumentBool(enable, 'enable');
    this.autoWait = enable;
};
