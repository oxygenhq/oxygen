/*
 * Copyright (C) 2019-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name pdf
 * @description Provides generic methods for working with PDF files.
 */

import OxError from '../errors/OxygenError';
const errHelper = require('../errors/helper');
const path = require('path');
var PDFParser = require('pdf2json/pdfparser');
var deasync = require('deasync');

function countRows(searchStr, rows, reverse) {
    let result = 0;

    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {
            var line = (rows[y] || []).join('').replace(/\s/g, '');
            let inludes;

            if (reverse) {
                const reverseSearchStr = searchStr.split('').reverse().join('');
                inludes = line.includes(searchStr) || line.includes(reverseSearchStr);
            } else {
                inludes = line.includes(searchStr);
            }

            if (inludes) {
                result++;
            }
        });

    return result;
}

function checkRows(searchStr, rows, reverse) {
    let result = false;

    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {

            var line = (rows[y] || []).join('').replace(/\s/g, '');

            let inludes;

            if (reverse) {
                const reverseSearchStr = searchStr.split('').reverse().join('');
                inludes = line.includes(searchStr) || line.includes(reverseSearchStr);
            } else {
                inludes = line.includes(searchStr);
            }

            if (inludes) {
                result = true;
                return true;
            }
        });

    return result;
}

function assertion(pdfFilePath, text, pageNum = 0, reverse = false) {
    let rows = {}; // indexed by y-position

    return new Promise(function(resolve, reject) {
        const searchStr = text.replace(/\s/g, '');

        let pdfParser = new PDFParser();
        pdfParser.on('pdfParser_dataError', function(err) {
            let errorMessage = err.parserError ? err.parserError : 'Error parsing the PDF.';
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, errorMessage);
        });

        pdfParser.on('pdfParser_dataReady', function (pdfData) {
            var totalPages = pdfData.formImage.Pages.length;
            if (pageNum && totalPages < pageNum - 1) {
                throw new OxError(errHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${totalPages} pages`);
            }

            // locate on a specific page
            if (pageNum) {
                processText(rows, pdfData.formImage.Pages[pageNum-1].Texts);
                let isFound = checkRows(searchStr, rows, reverse);
                resolve(!!isFound);
                return;
            }

            // locate on any page
            for (let p in pdfData.formImage.Pages) {
                processText(rows, pdfData.formImage.Pages[p].Texts);
                let isFound = checkRows(searchStr, rows, reverse);
                if (isFound) {
                    resolve(true);
                    break;
                }
                rows = {}; // clear rows for next page
            }

            resolve(false);
        });
        pdfParser.loadPDF(pdfFilePath, 0);
    });
}

function processText(rows, texts) {
    for (var t in texts) {
        var item = texts[t];
        item.text = decodeURIComponent(item.R[0].T);
        // accumulate text items into rows object, per line
        (rows[item.y] = rows[item.y] || []).push(item.text);
    }
}

function count(pdfFilePath, text, pageNum = 0, reverse = false) {
    let rows = {}; // indexed by y-position
    let totalCount = 0;

    return new Promise(function(resolve, reject) {
        const searchStr = text.replace(/\s/g, '');

        let pdfParser = new PDFParser();
        pdfParser.on('pdfParser_dataError', function(err) {
            let errorMessage = err.parserError ? err.parserError : 'Error parsing the PDF.';
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, errorMessage);
        });

        pdfParser.on('pdfParser_dataReady', function (pdfData) {
            let totalPages = pdfData.formImage.Pages.length;
            if (pageNum && totalPages < pageNum - 1) {
                throw new OxError(errHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${totalPages} pages`);
            }

            // count on a specific page
            if (pageNum) {
                processText(rows, pdfData.formImage.Pages[pageNum-1].Texts);
                let count = countRows(searchStr, rows, reverse);
                resolve(count);
                return;
            }

            // count on all pages
            for (var p in pdfData.formImage.Pages) {
                processText(rows, pdfData.formImage.Pages[p].Texts);
                let count = countRows(searchStr, rows, reverse);
                if (count > 0) {
                    totalCount += count;
                }
                rows = {}; // clear rows for next page
            }

            resolve(totalCount);
        });
        pdfParser.loadPDF(pdfFilePath, 0);
    });
}

function validateString(arg, name) {
    if (arg && typeof arg === 'string' && arg.trim().length > 0) {
        // text is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
    }
}

function validatePageNum(arg, name) {
    if (arg === null || (arg && typeof arg === 'number' && arg > 0)) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
    }
}

function validateMessage(arg, name) {
    if (arg === null || (arg && typeof arg === 'string' && arg.trim().length > 0)) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
    }
}

function validateReverse(arg, name) {
    if (arg === null || (typeof arg !== 'undefined' && typeof arg === 'boolean')) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a boolean");
    }
}

function resolvePath(pdfFilePath, options) {

    pdfFilePath = pdfFilePath.trim().split('').map((item, idx) => {
        return ![8206, 8296].includes(pdfFilePath.charCodeAt(idx)) ? item : null;
    }).join('');

    if (pdfFilePath[0] === '~') {
        // resolve path relative to home directory
        return path.join(process.env.HOME, pdfFilePath.slice(1));
    } else {
        let cwd = process.cwd();

        if (options && options.cwd) {
            cwd = options.cwd;
        }

        if (options && options.rootPath) {
            cwd = options.rootPath;
        }

        cwd = cwd.trim();

        return path.resolve(cwd, pdfFilePath);
    }
}

module.exports = function(options, context, rs, logger, modules, services) {

    module.isInitialized = function() {
        return true;
    };

    /**
     * @summary Asserts that text is present in a PDF file
     * @function assert
     * @param {String} pdfFilePath - Relative or absolute path to the PDF file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     */
    module.assert = function(pdfFilePath, text, pageNum = null, message = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, options);

        let error;
        try {
            let ret = null;
            assertion(pdfFilePath, text, pageNum, reverse).then(
                result => {
                    ret = result;
                },
                e => {
                    error = new OxError(errHelper.errorCode.ASSERT_ERROR, e.message || e);
                    ret = false;
                }
            );
            deasync.loopWhile(() => typeof ret !== 'boolean');

            if (!ret) {
                if (message) {
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
                }

                let msg = `"${text}" is not found in the PDF ${pageNum ? 'on page ' + pageNum : ''}`;
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, msg);
            }

        } catch (e) {
            error = new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }

        if (error) {
            throw error;
        }

    };

    /**
     * @summary Asserts that text is not present in a PDF file
     * @function assertNot
     * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     */
    module.assertNot = function(pdfFilePath, text, pageNum = null, message = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, options);

        let error;
        try {
            let ret = null;
            assertion(pdfFilePath, text, pageNum, reverse).then(
                result => {
                    ret = result;
                },
                e => {
                    error = new OxError(errHelper.errorCode.ASSERT_ERROR, e.message || e);
                    ret = false;
                }
            );

            deasync.loopWhile(() => typeof ret !== 'boolean');

            if (ret) {
                if (message) {
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
                }

                let msg = `"${text}" is found in the PDF ${pageNum ? 'on page ' + pageNum : ''}`;
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, msg);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }

        if (error) {
            throw error;
        }
    };

    /**
     * @summary Count the number of times specified text is present in a PDF file.
     * @function count
     * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
     * @param {String} text - Text to count.
     * @param {Number=} pageNum - Page number.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     * @return {Number} Number of times the specified text was found.
     */
    module.count = function(pdfFilePath, text, pageNum = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, options);

        let actual = null;
        count(pdfFilePath, text, pageNum, reverse).then(
            result => {
                actual = result;
            },
            error => {
                throw new OxError(errHelper.errorCode.PDF_ERROR, error.message || error);
            }
        );

        deasync.loopWhile(() => { return typeof actual !== 'number'; });

        return actual;
    };

    return module;
};
