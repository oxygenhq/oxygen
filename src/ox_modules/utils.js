/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

module.exports = {
    matchPattern: function(val, pattern) {
        if (!val && !pattern) {
            return true;
        }

        var globToRegex = require('glob-to-regexp');
        pattern = pattern.toString().replace(/\s+/g, ' ');

        var regex;
        if (pattern.indexOf('regex:') == 0) {                           // match using a regular-expression
            regex = new RegExp(pattern.substring('regex:'.length), 'g');
            return regex.test(val);
        } else if (pattern.indexOf('regexi:') == 0) {                   // match using a case-insensitive regular-expression
            regex = new RegExp(pattern.substring('regexi:'.length), 'ig');
            return regex.test(val);
        } else if (pattern.indexOf('exact:') == 0 || pattern === '') {  // match a string exactly, verbatim
            return pattern.substring('exact:'.length) === val;
        } else if (pattern.indexOf('glob:') == 0) {                     // match against a case-insensitive "glob" pattern
            regex = globToRegex(pattern.substring('glob:'.length), { flags: 'ig' });
            return regex.test(val);
        } else {                                                        // no prefix same as glob matching
            regex = globToRegex(pattern, { flags: 'ig' });
            return regex.test(val);
        }
    },

    getElement: function(locator, waitForVisible, timeout) {
        if (timeout) {
            module.exports.setTimeoutImplicit.call(this, timeout);
        }
        
        var el;
        if (locator && locator.constructor && locator.constructor.name === 'Element') {
            el = locator;
        } else {
            locator = this.helpers.getWdioLocator(locator);
            el = this.driver.$(locator);
        }

        if (el.error && (
            el.error.error === 'no such element' ||
            (el.error.message && el.error.message.startsWith('no such element')))) {
            if (timeout) {
                module.exports.restoreTimeoutImplicit.call(this);
            }
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }

        if (waitForVisible) {
            try {
                el.waitForDisplayed(timeout ? timeout : this.waitForTimeout);
            } catch (e) {
                if (timeout) {
                    module.exports.restoreTimeoutImplicit.call(this);
                }
                if (e.message && e.message.includes('still not displayed')) {
                    throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_VISIBLE);
                }
                throw e;
            }
        }

        if (timeout) {
            module.exports.restoreTimeoutImplicit.call(this);
        }

        return el;
    },

    getElements: function(locator, timeout) {
        if (timeout) {
            module.exports.setTimeoutImplicit.call(this, timeout);
        }
        
        var els = this.driver.$$(this.helpers.getWdioLocator(locator));

        if (els.error && els.error.error === 'no such element') {
            if (timeout) {
                module.exports.restoreTimeoutImplicit.call(this);
            }
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }

        if (timeout) {
            module.exports.restoreTimeoutImplicit.call(this);
        }

        return els;
    },

    getChildElement: function(locator, parentElement, waitForVisible, timeout) {
        if (timeout) {
            module.exports.setTimeoutImplicit.call(this, timeout);
        }
        
        locator = this.helpers.getWdioLocator(locator);

        var el = parentElement.$(locator);

        if (el.error && el.error.error === 'no such element') {
            if (timeout) {
                module.exports.restoreTimeoutImplicit.call(this);
            }
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }

        if (waitForVisible) {
            try {
                el.waitForDisplayed(timeout ? timeout : this.waitForTimeout);
            } catch (e) {
                if (timeout) {
                    module.exports.restoreTimeoutImplicit.call(this);
                }
                if (e.message && e.message.includes('still not displayed')) {
                    throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_VISIBLE);
                }
                throw e;
            }
        }

        if (timeout) {
            module.exports.restoreTimeoutImplicit.call(this);
        }

        return el;
    },

    getChildElements: function(locator, parentElement, timeout) {
        if (timeout) {
            module.exports.setTimeoutImplicit.call(this, timeout);
        }
        
        locator = this.helpers.getWdioLocator(locator);

        var els = parentElement.$$(locator);

        if (els.error && els.error.error === 'no such element') {
            if (timeout) {
                module.exports.restoreTimeoutImplicit.call(this);
            }
            throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
        }

        if (timeout) {
            module.exports.restoreTimeoutImplicit.call(this);
        }

        return els;
    },

    setTimeoutImplicit: function(timeout) {
        var timeouts = this.driver.getTimeouts();
        this._prevImplicitTimeout = timeouts.implicit;
        this.driver.setTimeout({ 'implicit': timeout });
    },

    restoreTimeoutImplicit: function() {
        if (this._prevImplicitTimeout) {
            this.driver.setTimeout({ 'implicit': this._prevImplicitTimeout });
        }
    },

    assertArgument: function(arg, name) {
        if (arg === undefined || arg === null) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' is required.");
        }
    },

    assertArgumentNonEmptyString: function(arg, name) {
        if (!arg || typeof arg !== 'string') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
        }
    },

    assertArgumentNumber: function(arg, name) {
        if (typeof(arg) !== 'number') {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a number.");
        }
    },

    assertArgumentNumberNonNegative: function(arg, name) {
        if (typeof(arg) !== 'number' || arg < 0) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
        }
    },

    assertArgumentBool: function(arg, name) {
        if (typeof(arg) != typeof(true)) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be true or false.");
        }
    },

    assertArgumentBoolOptional: function(arg, name) {
        if (typeof(arg) !== 'undefined' && typeof(arg) != typeof(true)) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be true or false.");
        }
    },

    assertArgumentTimeout: function(arg, name) {
        if (arg && (typeof(arg) !== 'number' || arg < 0)) {
            throw new this.OxError(this.errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non negative number.");
        }
    }
};
