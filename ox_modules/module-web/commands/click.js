/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Clicks on an element.
 * @description If the click causes new page to load, the command waits for page to load before
 *              proceeding.
 * @function click
 * @param {String} locator - An element locator.
 * @example <caption>[javascript] Usage example</caption>
 * web.init();//Opens browser session.
 * web.open("www.yourwebsite.com");// Opens a website.
 * web.click("id=NextPage");//Clicks on next page link.
 */
module.exports = function(locator) {
    try {
        if (this.autoWait) {
            this.waitForExist(locator);
        }
        // when locator is an element object
        if (typeof locator === 'object' && locator.click) {
            return locator.click();
        }
        // when locator is string
        locator = this.helpers.getWdioLocator(locator);
        return this.driver.click(locator);
    } catch (e) {
        /* {
        "message": "unknown error: Element <button id=\"myBtn\">...</button> is not clickable at point (52, 77). Other element would receive the click: <div id=\"myModal\" class=\"modal\" style=\"display: block;\">...</div>",
        "type": "RuntimeError",
        "seleniumStack": {
          "type": "UnknownError",
          "message": "An unknown server-side error occurred while processing the command.",
          "orgStatusMessage": "unknown error: Element <button id=\"myBtn\">...</button> is not clickable at point (52, 77). Other element would receive the click: <div id=\"myModal\" class=\"modal\" style=\"display: block;\">...</div>\n  (Session info: chrome=67.0.3396.99)\n  (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.16299 x86_64)"
        }
        {
          "message": "element not visible",
          "type": "RuntimeError",
          "seleniumStack": {
            "type": "ElementNotVisible",
            "message": "An element command could not be completed because the element is not visible on the page.",
            "orgStatusMessage": "element not visible\n  (Session info: chrome=69.0.3497.81)\n  (Driver info: chromedriver=2.41.578737 (49da6702b16031c40d63e5618de03a32ff6c197e),platform=Windows NT 10.0.16299 x86_64)"
          }
        }
        {
          "message": "element not interactable",
          "type": "RuntimeError",
          "seleniumStack": {
            "type": "ElementNotVisible",
            "message": "An element command could not be completed because the element is not visible on the page.",
            "orgStatusMessage": "element not interactable\n  (Session info: chrome=70.0.3538.110)\n  (Driver info: chromedriver=2.44.609538 (b655c5a60b0b544917107a59d4153d4bf78e1b90),platform=Windows NT 10.0.16299 x86_64)"
          }
        }
        
        // Internet Explorer specific
        {
         message: 'Element is not displayed\nBuild info: version: \'3.141.5\', revision: \'d54ebd709a\', time: \'2018-11-06T11:58:47\'\nSystem info: host: \'HQIT16112\', ip: \'10.11.105.1\', os.name: \'Windows 7\', os.arch: \'x86\', os.version: \'6.1\', java.version:\'1.8.0_73\'\nDriver info: driver.version: unknown',
         type: 'RuntimeError',
         seleniumStack: {
           type: 'Unknown',
           message: 'Remote end send an unknown status code.',
           orgStatusMessage: 'Element is not displayed\nBuild info: version: \'3.141.5\', revision: \'d54ebd709a\', time: \'2018-11-06T11:58:47\'\nSystem info: host: \'HQIT16112\', ip: \'10.11.105.1\', os.name: \'Windows 7\', os.arch: \'x86\', os.version: \'6.1\', java.version: \'1.8.0_73\'\nDriver info: driver.version: unknown' 
         }
        }
        */
        if (e.message &&
            (e.message.includes('is not clickable at point')
                || e.message === 'element not visible'
                || e.message === 'element not interactable'
                || e.message.startsWith('Element is not displayed'))) {
            this.clickHidden(locator);
        } else {
            throw e;
        }
    }
};
