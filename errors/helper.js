/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * Helper module for handling and converting various error types
 */

var OxError = require('../errors/OxygenError');
var util = require('util');

const ERROR_CODES = {
    SCRIPT_ERROR: 'SCRIPT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ASSERT_ERROR: 'ASSERT_ERROR',
    PDF_ERROR: 'PDF_ERROR',
    VERIFY_ERROR: 'VERIFY_ERROR',
    ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
    FRAME_NOT_FOUND: 'FRAME_NOT_FOUND',
    UNKNOWN_COMMAND_ERROR: 'UNKNOWN_COMMAND_ERROR',
    STALE_ELEMENT_REFERENCE: 'STALE_ELEMENT_REFERENCE',
    ELEMENT_NOT_VISIBLE: 'ELEMENT_NOT_VISIBLE',
    LOCATOR_MATCHES_MULTIPLE_ELEMENTS: 'LOCATOR_MATCHES_MULTIPLE_ELEMENTS',
    ELEMENT_STILL_EXISTS: 'ELEMENT_STILL_EXISTS',
    BROWSER_JS_EXECUTE_ERROR: 'BROWSER_JS_EXECUTE_ERROR',
    TIMEOUT: 'TIMEOUT',
    WINDOW_NOT_FOUND: 'WINDOW_NOT_FOUND',
    UNEXPECTED_ALERT_OPEN: 'UNEXPECTED_ALERT_OPEN',
    NO_ALERT_OPEN_ERROR: 'NO_ALERT_OPEN_ERROR',
    MAILINATOR_ERROR: 'MAILINATOR_ERROR',
    APPIUM_UNREACHABLE_ERROR: 'APPIUM_UNREACHABLE_ERROR',
    SELENIUM_UNREACHABLE_ERROR: 'SELENIUM_UNREACHABLE_ERROR',
    CHROMEDRIVER_ERROR: 'CHROMEDRIVER_ERROR',
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DB_QUERY_ERROR: 'DB_QUERY_ERROR',
    SOAP_ERROR: 'SOAP_ERROR',
    NOT_IMPLEMENTED_ERROR: 'NOT_IMPLEMENTED_ERROR',
    SERIAL_PORT_ERROR: 'SERIAL_PORT_ERROR',
    HTTP_ERROR: 'HTTP_ERROR',
    EMAIL_ERROR: 'EMAIL_ERROR',
    MODULE_NOT_INITIALIZED_ERROR: 'MODULE_NOT_INITIALIZED_ERROR',
    WAIT_FOR_TIMEOUT: 'WAIT_FOR_TIMEOUT',
    DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
    PARAMETERS_ERROR: 'PARAMETERS_ERROR',
    INVALID_CAPABILITIES: 'INVALID_CAPABILITIES',
    BROWSER_CONFIGURATION_ERROR: 'BROWSER_CONFIGURATION_ERROR',
    APPIUM_RUNTIME_ERROR: 'APPIUM_RUNTIME_ERROR',
    SELENIUM_RUNTIME_ERROR: 'SELENIUM_RUNTIME_ERROR',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    OPTION_NOT_FOUND: 'OPTION_NOT_FOUND',
    ATTRIBUTE_NOT_FOUND: 'ATTRIBUTE_NOT_FOUND'
};

// Chai to Oxygen error codes mapping
const CHAI_ERROR_CODES = {
    AssertionError: ERROR_CODES.ASSERT
};

const ORIGINAL_ERROR_MESSAGE = 'Original error: ';

module.exports = {
    getOxygenError: function(err, module, cmd, args) {
        // return the error as is if it has been already processed
        if (err instanceof OxError) {
            return err;
        }
        
        var errType = err.type || err.name || typeof err;
        
        // handle various types of 'Original error'
        if (err.message.indexOf(ORIGINAL_ERROR_MESSAGE) > -1) {
            const originalError = err.message.substring(err.message.indexOf(ORIGINAL_ERROR_MESSAGE) + ORIGINAL_ERROR_MESSAGE.length);

            console.log('Error details:');
            console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
            console.log(util.inspect(err));

            return new OxError(ERROR_CODES.UNKNOWN_ERROR, originalError, util.inspect(err));
        }

        // try to resolve Chai error code
        var oxErrorCode = CHAI_ERROR_CODES[errType];
        if (oxErrorCode) {
            // throw non-fatal error if it's a "verify" module or method 
            if (oxErrorCode === ERROR_CODES.ASSERT && 
				(module === 'verify' || cmd.indexOf('verify') === 0)) { // verify.*, *.verify*
                return new OxError(ERROR_CODES.VERIFY, err.message, null, false);
            }
            return new OxError(oxErrorCode, err.message, null);
        }
        
        console.log('Error details:');
        console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
        console.log(util.inspect(err));

        return new OxError(ERROR_CODES.UNKNOWN_ERROR, err.type + ': ' + err.message, util.inspect(err));
    },
    getSeleniumInitError: function(err) {
        if (err.message) {
            var ieZoomErrorMsg = err.message.match(/(Unexpected error launching Internet Explorer\. Browser zoom level was set to \d+%\. It should be set to \d+%)/gm);
            if (ieZoomErrorMsg) {
                return new OxError(ERROR_CODES.BROWSER_CONFIGURATION_ERROR, ieZoomErrorMsg.toString());
            }
        }

        if (err.message && err.message.indexOf('cannot find Chrome binary') > -1) {
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, 'Cannot find Chrome binary');
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
            return new OxError(ERROR_CODES.SELENIUM_UNREACHABLE_ERROR, "Couldn't connect to Selenium server");
        }

        console.log('Error details:');
        console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
        console.log(util.inspect(err));

        return new OxError(ERROR_CODES.UNKNOWN_ERROR, err.type + ': ' + err.message, util.inspect(err));
    },
    getAppiumInitError: function(err) {
        if (err.message && err.message.indexOf('cannot find Chrome binary') > -1) {
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, 'Cannot find Chrome binary');
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
            return new OxError(ERROR_CODES.APPIUM_UNREACHABLE_ERROR, "Couldn't connect to Appium server");
        } else if (err.message && err.message.indexOf('Could not find a connected Android device') > -1) {
            return new OxError(ERROR_CODES.DEVICE_NOT_FOUND, 'Could not find a connected Android device');
        } else if (err.message && err.message.indexOf('Unable to automate Chrome version') > -1) {
            const originalError = err.message.substring(err.message.indexOf(ORIGINAL_ERROR_MESSAGE) + ORIGINAL_ERROR_MESSAGE.length);
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, originalError);
        }

        console.log('Error details:');
        console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
        console.log(util.inspect(err));

        if (err.message && err.message.indexOf(ORIGINAL_ERROR_MESSAGE) > -1) {
            const originalError = err.message.substring(err.message.indexOf(ORIGINAL_ERROR_MESSAGE) + ORIGINAL_ERROR_MESSAGE.length);
            return new OxError(ERROR_CODES.UNKNOWN_ERROR, originalError, util.inspect(err));
        } else {
            return new OxError(ERROR_CODES.UNKNOWN_ERROR, err.message, util.inspect(err));
        }
    },
    getAssertError: function(expected, actual) {
        actual = actual.toString().replace(/\n/g, '\\n');
        return new OxError(ERROR_CODES.ASSERT_ERROR, `Expected: "${expected}". Got: "${actual}"`);
    },
    errorCode: ERROR_CODES
};
