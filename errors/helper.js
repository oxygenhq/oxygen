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
 
const OxError = require('../errors/OxygenError').default;
const OxScriptError = require('../errors/ScriptError').default;
const Failure = require('../model/failure');
const util = require('util');
const stackTrace = require('stack-trace');

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

// General JavaScript error codes mapping
const SCRIPT_ERROR_CODES = {
    TypeError: ERROR_CODES.SCRIPT_ERROR,
    SyntaxError: ERROR_CODES.SCRIPT_ERROR,
};

module.exports = {
    getFailureFromError: function(err) {
        if (!err) {
            return null;
        }
        if (!(err instanceof OxError)) {
            err = this.getOxygenError(err);
        }
        return {
            type: err.type,
            message: err.message,
            data: err.data,
            location: err.location
        }
    },
    getOxygenError: function(err, module, cmd, args) {
        // return the error as is if it has been already processed
        if (err instanceof OxError) {
            return err;
        }
        var errType = err.type || err.name || typeof err;

        // handle "invalid argument: Unsupported locator strategy: -android uiautomator" for mobile.
        // usually due to not using the correct context
        if (err.message && err.message.includes('Unsupported locator strategy')) {
            var matches = err.message.match(/invalid argument: (.*)/i);
            return new OxError(ERROR_CODES.MOBILE_CONTEXT_ERROR, (matches.length === 2 ? matches[1] : err.message) +
                '. Make sure you are using the correct mobile context. See mob.setNativeContext and mob.setWebViewContext.');
        }

        if (err.message && (err.message.includes('Unable to automate Chrome version') ||
            err.message.includes('No Chromedriver found that can automate'))) {
            return new OxError(ERROR_CODES.CHROMEDRIVER_ERROR, extractOriginalError(err.message));
        }

        // handle various types of 'Original error'
        if (err.message && err.message.indexOf(ORIGINAL_ERROR_MESSAGE) > -1) {
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
            return new OxError(oxErrorCode, err.message, null, true, errType);
        }

        // try to resolve JavaScript error code
        oxErrorCode = SCRIPT_ERROR_CODES[errType];
        if (oxErrorCode) {
            // throw non-fatal error if it's a "verify" module or method 
            if (oxErrorCode === ERROR_CODES.ASSERT && 
				(module === 'verify' || cmd.indexOf('verify') === 0)) { // verify.*, *.verify*
                return new OxError(ERROR_CODES.VERIFY, err.message, null, false);
            }
            return new OxError(oxErrorCode, err.message || null, null, true, errType);
        }
        
        const errMessage = err.message ? `${errType}: ${err.message}` : `${errType}`;
        return new OxError(ERROR_CODES.UNKNOWN_ERROR, errMessage, util.inspect(err));
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
        } else if (err.message === 'All minutes for this organization has been exausted' ||
            err.message === '401 Unauthorized') {
            return new OxError(ERROR_CODES.SELENIUM_CONNECTION_ERROR, err.message);
        }

        console.log('=== Error Details ===');
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

        console.log('=== Error Details ===');
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
