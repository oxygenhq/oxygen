/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * Provides methods for Applitools Eyes
 */

module.exports = function(argv, context, rs, logger, dispatcher) {
    var module = { modType: 'dotnet' };
    if (dispatcher) {
        dispatcher.execute('eyes', 'moduleInit', argv);
    }
    
    /**
     * @summary Performs validation on the whole window.
     * @description This method always succeeds irregardless of validation result.
     * @function checkWindow
     */
    module.checkWindow = function() { return dispatcher.execute('eyes', 'checkWindow', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Performs validation on the specified element.
     * @description This method always succeeds irregardless of validation result.
     * @function checkRegion
     * @param {String} locator - An element locator.
     */
    module.checkRegion = function() { return dispatcher.execute('eyes', 'checkRegion', Array.prototype.slice.call(arguments)); };
     /**
     * @summary Initializes Applitools Eyes.
     * @function init
     * @param {String} apiKey - Applitools API key.
     * @param {String} appName - String that represents the logical name of the AUT (this name will
     *                           be presented in the test result).
     * @param {String} testName - String that represents the name of the test (this name will be 
     *                            presented in the test result)
     */ 
    module.init = function() { return dispatcher.execute('eyes', 'init', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Notifies Eyes service that the test has been completed.
     * @function close
     * @return {Object} Object describing the test status details. //TODO: add structure details
     */ 
    module.close = function() { return dispatcher.execute('eyes', 'close', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Allows forcing full page screenshots.
     * @function forceFullPageScreenshot
     * @param {Boolean} force - true to force full page screenshot, false otherwise.
     */ 
    module.forceFullPageScreenshot = function() { return dispatcher.execute('eyes', 'forceFullPageScreenshot', Array.prototype.slice.call(arguments)); };
    
    module._iterationEnd = function(vars) {
        dispatcher.execute('eyes', 'iterationEnd', {});
    };
    
    return module;
};
