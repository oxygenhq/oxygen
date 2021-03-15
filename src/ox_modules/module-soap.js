/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name soap
 * @description Provides methods for working with SOAP based Web Services.
 */

import OxError from '../errors/OxygenError';
var errHelper = require('../errors/helper');

module.exports = function() {
    var deasync = require('deasync');
    var soap = require('soap');
    var auth = null;
    var proxyOptions = {};
    var options = {
        rejectUnauthorized: false
    };

    module.isInitialized = function() {
        return true;
    };
    /**
     * @summary Sets proxy url to be used for connections with the service.
     * @function setProxy
     * @param {String} url - proxu url. Call without arguments will clean proxy url.
     */
    module.setProxy = function(url) {
        if (url) {
            proxyOptions =  { proxy: url };
        } else {
            proxyOptions = {};
        }
    };

    /**
     * @summary Sets Basic Authentication details to be used for connections with the service.
     * @function authBasic
     * @param {String} user - Username.
     * @param {String} pass - Password.
     */
    module.authBasic = function(user, pass) {
        auth = new soap.BasicAuthSecurity(user, pass);
    };

    /**
     * @summary Sets Bearer Token Authentication details to be used for connections with the service.
     * @function authBearer
     * @param {String} token - Token.
     */
    module.authBearer = function(token) {
        auth = new soap.BearerSecurity(token);
    };

    /**
     * @summary Sets NTLM Authentication details to be used for connections with the service.
     * @function authNTLM
     * @param {String} user - Username.
     * @param {String} pass - Password.
     * @param {String} domain - Domain.
     * @param {String} workstation - Workstation.
     */
    module.authNTLM = function(user, pass, domain, workstation) {
        auth = new soap.NTLMSecurity(user, pass, domain, workstation);
    };

    /**
     * @summary Initiates a SOAP request and returns the response.
     * @function get
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} method - Method name (case sensitive).
     * @param {Object=} args - Object containing the arguments.
     * @return {Object} The response object.
     * @example <caption>[javascript] Usage example</caption>
     * // get SOAP service description, so we can understand what methods it provides,
     * // what input parameters it expects, and what is the output structure.
     * var serviceUrl = 'http://www.dataaccess.com/webservicesserver/numberconversion.wso?WSDL';
     * var serviceDescription = soap.describe(serviceUrl);
     * log.info(serviceDescription);
     * 
     * // NumberToWords method in this service converts number to words.
     * var result = soap.get(serviceUrl, 'NumberToWords', { 'ubiNum': 2019 });
     * log.info(result.NumberToWordsResult);
     */
    module.get = function(wsdlUrl, method, args) {
        var resultClient = null;
        var result = null;

        soap.createClient(wsdlUrl, { wsdl_options: { ...options, ...proxyOptions }}, (err, client) => {
            if (client === undefined) {
                var msg =  'Error creating client';
                if (err.message) {
                    var soapMsg = err.message;
                    var firstBreakIndex = soapMsg.indexOf('\n');
                    if (firstBreakIndex > 0) {
                        soapMsg = err.message.substring(0, firstBreakIndex);
                    }
                    msg += ': ' + soapMsg;
                } else if (err && (typeof err === 'string' || err instanceof String)) {
                    msg += ': ' + err;
                }
                resultClient = new OxError(errHelper.errorCode.SOAP_ERROR, msg);
                return;
            }

            resultClient = client;

            if (typeof client[method] !== 'function') {
                resultClient = new OxError(errHelper.errorCode.SOAP_ERROR, 'No method named ' + method + ' was found.');
                return;
            }

            if (auth) {
                client.setSecurity(auth);
            }

            client[method](args, (err, res) => {
                if (err !== null) {
                    result = new OxError(errHelper.errorCode.SOAP_ERROR, err.root.Envelope.Body.Fault.faultstring);
                    return;
                }

                result = res;
            }, { ...options, ...proxyOptions });
        });

        deasync.loopWhile(() => !resultClient);
        if (resultClient.type === errHelper.errorCode.SOAP_ERROR) {
            throw resultClient;
        }

        deasync.loopWhile(() => !result);
        if (result.type === errHelper.errorCode.SOAP_ERROR) {
            throw result;
        }

        return result;
    };

    /**
     * @summary Returns SOAP service description.
     * @function describe
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @return {Object} Service description.
     */
    module.describe = function(wsdlUrl) {
        var resultClient = null;

        soap.createClient(wsdlUrl,{ wsdl_options: { ...options, ...proxyOptions }}, (err, client) => {
            if (client === undefined) {
                var msg =  'Error creating client';
                if (err.message) {
                    var soapMsg = err.message;
                    var firstBreakIndex = soapMsg.indexOf('\n');
                    if (firstBreakIndex > 0) {
                        soapMsg = err.message.substring(0, firstBreakIndex);
                    }
                    msg += ': ' + soapMsg;
                } else if (err && (typeof err === 'string' || err instanceof String)) {
                    msg += ': ' + err;
                }
                resultClient = new OxError(errHelper.errorCode.SOAP_ERROR, msg);
                return;
            }

            if (auth) {
                client.setSecurity(auth);
            }

            resultClient = client.describe();
        });

        deasync.loopWhile(() => !resultClient);
        if (resultClient.type === errHelper.errorCode.SOAP_ERROR) {
            throw resultClient;
        }

        return resultClient;
    };

    return module;
};
