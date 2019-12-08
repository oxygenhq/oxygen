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
    APPIUM_CONNECTION_ERROR: 'APPIUM_CONNECTION_ERROR',
    SELENIUM_CONNECTION_ERROR: 'SELENIUM_CONNECTION_ERROR',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    OPTION_NOT_FOUND: 'OPTION_NOT_FOUND',
    ATTRIBUTE_NOT_FOUND: 'ATTRIBUTE_NOT_FOUND',
    ELEMENT_STATE_ERROR: 'ELEMENT_STATE_ERROR',
    MOBILE_CONTEXT_ERROR: 'MOBILE_CONTEXT_ERROR',
    APPLICATION_NOT_FOUND_ERROR: 'APPLICATION_NOT_FOUND_ERROR',
    TWILIO_ERROR: 'TWILIO_ERROR'
};

// Chai to Oxygen error codes mapping
const CHAI_ERROR_CODES = {
    AssertionError: ERROR_CODES.ASSERT
};

module.exports = {
    getOxygenError: function(err, module, cmd, args) {
        // return the error as is if it has been already processed
        if (err instanceof OxError) {
            return err;
        }
        
        var errType = err.type || err.name || typeof err;

        // handle "invalid argument: Unsupported locator strategy: -android uiautomator" for mobile.
        // usually due to not using the correct context
        if (err.message && err.message.includes('Unsupported locator strategy')) {
            let matches = err.message.match(/invalid argument: (.*)/i);
            return new OxError(ERROR_CODES.MOBILE_CONTEXT_ERROR, (matches.length === 2 ? matches[1] : err.message) +
                '. Make sure you are using the correct mobile context. See mob.setNativeContext and mob.setWebViewContext.');
        }
        // handle "invalid selector: Unable to locate an element with the xpath expression"
        // usually due to invalid xpath
        else if (err.message && err.message.includes('invalid selector: Unable to locate an element with the xpath expression')) {
            let matches = err.message.match(/(The string '.*' is not a valid XPath expression.)/i);
            return new OxError(ERROR_CODES.SCRIPT_ERROR, (matches.length === 2 ? matches[1] : err.message));
        }
        else if (err.message && (err.message.includes('Unable to automate Chrome version') ||
            err.message.includes('No Chromedriver found that can automate'))) {
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, extractOriginalError(err.message));
        }
        // handle various types of 'Original error'
        else if (err.message.indexOf(ORIGINAL_ERROR_MESSAGE) > -1) {
            console.log('Error details:');
            console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
            console.log(util.inspect(err));

            return new OxError(ERROR_CODES.UNKNOWN_ERROR, extractOriginalError(err.message), util.inspect(err));
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
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.message === 'Failed to create session.\nsocket hang up') {
            return new OxError(ERROR_CODES.SELENIUM_UNREACHABLE_ERROR, "Couldn't connect to Selenium server");
        } else if (err.message === 'All minutes for this organization has been exausted' ||
            err.message === '401 Unauthorized') {
            return new OxError(ERROR_CODES.SELENIUM_CONNECTION_ERROR, err.message);
        } else if (err.message.includes('Unable to create new service:')) {
            return new OxError(ERROR_CODES.SELENIUM_CONNECTION_ERROR, err.message + '\n\nThis is probably due to missing ChromeDriver/IEDriverServer/GeckoDriver binary.\n');
        }

        console.log('Error details:');
        console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
        console.log(util.inspect(err));

        return new OxError(ERROR_CODES.UNKNOWN_ERROR, err.type + ': ' + err.message, util.inspect(err));
    },
    getAppiumInitError: function(err) {
        if (err.message && err.message.indexOf('cannot find Chrome binary') > -1) {
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, 'Cannot find Chrome binary');
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND' || err.message === 'Failed to create session.\nsocket hang up') {
            return new OxError(ERROR_CODES.APPIUM_UNREACHABLE_ERROR, "Couldn't connect to Appium server");
        } else if (err.message && err.message.indexOf('Could not find a connected Android device') > -1) {
            return new OxError(ERROR_CODES.DEVICE_NOT_FOUND, 'Could not find a connected Android device');
        } else if (err.message && err.message.indexOf('Unable to automate Chrome version') > -1) {          // appium <= 1.14
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, extractOriginalError(err.message));
        } else if (err.message && err.message.indexOf('No Chromedriver found that can automate') > -1) {    // appium >= 1.15
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, extractOriginalError(err.message));
        } else if (err.message && err.message.indexOf('Unable to find an active device or emulator with') > -1) {
            return new OxError(ERROR_CODES.DEVICE_NOT_FOUND, extractOriginalError(err.message));
        } else if (err.message && err.message.indexOf('is not installed on device') > -1) {
            return new OxError(ERROR_CODES.APPLICATION_NOT_FOUND_ERROR, extractOriginalError(err.message));
        } else if (err.message === 'All minutes for this organization has been exausted' ||
            err.message === '401 Unauthorized') {
            return new OxError(ERROR_CODES.APPIUM_CONNECTION_ERROR, err.message);
        }

        console.log('Error details:');
        console.log('Type: ' + err.type + ' Name: ' + err.name + ' Code: ' + err.code + ' Msg: ' + err.message);
        console.log(util.inspect(err));

        return new OxError(ERROR_CODES.UNKNOWN_ERROR, extractOriginalError(err.message), util.inspect(err));
    },
    getAssertError: function(expected, actual) {
        actual = actual.toString().replace(/\n/g, '\\n');
        return new OxError(ERROR_CODES.ASSERT_ERROR, `Expected: "${expected}". Got: "${actual}"`);
    },
    errorCode: ERROR_CODES
};

const ORIGINAL_ERROR_MESSAGE = 'Original error: ';
const UNKNOWN_ERROR_MESSAGE = 'unknown error: ';

function extractOriginalError(msg) {
    if (!msg) {
        return '';
    }

    var errorIndex1 = msg.indexOf(ORIGINAL_ERROR_MESSAGE);
    if (errorIndex1 === -1) {
        return msg;
    }

    // there could anothe nested "original error"
    var errorIndex2 = msg.indexOf(ORIGINAL_ERROR_MESSAGE, errorIndex1 + ORIGINAL_ERROR_MESSAGE.length);

    msg = msg.substring((errorIndex2 > -1 ? errorIndex2 : errorIndex1)  + ORIGINAL_ERROR_MESSAGE.length);

    // strip 'unknown error:'
    var unknownErrorIndex = msg.indexOf(UNKNOWN_ERROR_MESSAGE);
    if (unknownErrorIndex > -1) {
        return msg.substring(unknownErrorIndex + UNKNOWN_ERROR_MESSAGE.length);
    }

    return msg;
}
