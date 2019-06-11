/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Send a sequence of keyboard strokes to the active window or element.
 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
 *              for the list of supported raw keyboard key codes.
 * @function sendKeys
 * @param {String} value - Sequence of key strokes to send.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.sendKeys(‘\uE03B’);//Types keys by reference to a key code.
*/
module.exports = function(value) {
    this.helpers.assertArgument(value);

    // process special keys
    switch(value){
        case 'PageUp':
            value='\uE054';
            break;
        case 'PageDown':
            value='\uE055';
            break;
        case 'End':
            value='\uE056';
            break;
        case 'Home':
            value='\uE057';
            break;
        case 'ArrowLeft':
            value='\uE058';
            break;
        case 'ArrowUp':
            value='\uE059';
            break;
        case 'ArrowRight':
            value='\uE05A';
            break;
        case 'ArrowDown':
            value='\uE05B';
            break;
        case 'Insert':
            value='\uE05C';
            break;
        case 'Delete':
            value='\uE05D';
            break;
        case 'Enter':
            value='\uE007';
            break;
    }

    this.driver.keys(value);
};
