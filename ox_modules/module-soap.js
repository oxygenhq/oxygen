/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * Provides methods for working with SOAP based Web Services.
 * <br /><br />
 * NOTE: Multi-argument calls are not supported yet.
 */

module.exports = function(argv, context, rs, logger, dispatcher) {
    var module = { modType: 'dotnet' };

    /**
     * @summary Initiates a SOAP request and returns the response.
     * @function get
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get = function() { return dispatcher.execute('soap', 'get', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Initiates a SOAP 1.2 request and returns the response.
     * @function get12
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get12 = function() { return dispatcher.execute('soap', 'get12', Array.prototype.slice.call(arguments)); };
    
    return module;
};
