/**
 * Helper module for handling and converting various error types
 */

var SeleniumError = require('../errors/SeleniumError');
var OxError = require('../errors/OxygenError');

const ERROR_CODES = {
    SCRIPT_ERROR: "SCRIPT_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    ASSERT: "ASSERT",
    NO_SUCH_ELEMENT: "NO_SUCH_ELEMENT",
    NO_SUCH_FRAME: "NO_SUCH_FRAME",
    UNKNOWN_COMMAND: "UNKNOWN_COMMAND",
    STALE_ELEMENT_REFERENCE: "STALE_ELEMENT_REFERENCE",
    ELEMENT_NOT_VISIBLE: "ELEMENT_NOT_VISIBLE",
    BROWSER_JS_EXECUTE_ERROR: "BROWSER_JS_EXECUTE_ERROR",
    TIMEOUT: "TIMEOUT",
    NO_SUCH_WINDOW: "NO_SUCH_WINDOW",
    UNEXPECTED_ALERT_OPEN: "UNEXPECTED_ALERT_OPEN",
    NO_ALERT_OPEN_ERROR: "NO_ALERT_OPEN_ERROR",
};

// WebdriverIO to Oxygen error codes mapping
// https://github.com/webdriverio/webdriverio/blob/master/lib/helpers/constants.js
// TODO: codes not directly mapped to ERROR_CODES need to be reviewed specificly their behaviour in web/mob modes.
const WDIO_ERROR_CODES = {
    // selenium error codes https://w3c.github.io/webdriver/webdriver-spec.html#dfn-error-code
    Unknown: ERROR_CODES.UNKNOWN_ERROR,
    NoSuchDriver: "NO_SUCH_DRIVER",
    NoSuchElement: ERROR_CODES.NO_SUCH_ELEMENT,
    NoSuchFrame: ERROR_CODES.NO_SUCH_FRAME,
    UnknownCommand: ERROR_CODES.UNKNOWN_COMMAND,
    StaleElementReference: ERROR_CODES.STALE_ELEMENT_REFERENCE,
    ElementNotVisible: ERROR_CODES.ELEMENT_NOT_VISIBLE,
    InvalidElementState: "INVALID_ELEMENT_STATE",
    UnknownError: ERROR_CODES.UNKNOWN_ERROR,
    ElementIsNotSelectable: "ELEMENT_IS_NOT_SELECTABLE",
    JavaScriptError: ERROR_CODES.BROWSER_JS_EXECUTE_ERROR,
    XPathLookupError: ERROR_CODES.NO_SUCH_ELEMENT,
    Timeout: ERROR_CODES.TIMEOUT,
    NoSuchWindow: ERROR_CODES.NO_SUCH_WINDOW,
    InvalidCookieDomain: "INVALID_COOKIE_DOMAIN",
    UnableToSetCookie: "UNABLE_TO_SET_COOKIE",
    UnexpectedAlertOpen: ERROR_CODES.UNEXPECTED_ALERT_OPEN,
    NoAlertOpenError: ERROR_CODES.NO_ALERT_OPEN_ERROR,
    ScriptTimeout: ERROR_CODES.UNKNOWN_ERROR,                       // FIXME
    InvalidElementCoordinates: "INVALID_ELEMENT_COORDINATES",
    IMENotAvailable: "IME_NOT_AVAILABLE",
    IMEEngineActivationFailed: "IME_ENGINE_ACTIVATION_FAILED",
    InvalidSelector: "INVALID_SELECTOR",
    SessionNotCreatedException: "SESSION_NOT_CREATED_EXCEPTION",
    ElementNotScrollable: "ELEMENT_NOT_SCROLLABLE",
    // WebdriverIO specific error codes
    SelectorTimeoutError: "SELECTOR_TIMEOUT_ERROR",
    NoSessionIdError: "NO_SESSION_ID_ERROR",
    GridApiError: "GRID_API_ERROR"
};

// Chai to Oxygen error codes mapping
const CHAI_ERROR_CODES = {
     AssertionError: ERROR_CODES.ASSERT
};

var self = module.exports = {
    getOxygenError: function(err, cmd, args, opts, caps) {
        // return the error as is if it has been already processed
        if (err instanceof OxError) {
            return err;
        }
        
        var errType = err.type || err.name || typeof err;
        
        // FIXME:
        if (errType === 'RuntimeError') {
            if (err.seleniumStack) {
                return new SeleniumError(err, cmd, args, opts, caps);
            }   
        }

        // try to resolve WDIO error code 
        var oxErrorCode = WDIO_ERROR_CODES[errType];
        if (oxErrorCode) {
            return new OxError(oxErrorCode, err.message, null);
        }
        
        // try to resolve Chai error code
        oxErrorCode = CHAI_ERROR_CODES[errType];
        if (oxErrorCode) {
            return new OxError(oxErrorCode, err.message, null);
        }
        
        return new OxError(ERROR_CODES.UNKNOWN_ERROR, err.type + ': ' + err.message, null);
    },
    
    errorCode: ERROR_CODES
};