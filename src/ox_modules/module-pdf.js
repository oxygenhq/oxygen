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

import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import * as errHelper from '../errors/helper';
const path = require('path');
const PDFParser = require('pdf2json/pdfparser');

function countRows(searchStr, rows, reverse) {
    let result = 0;
    var strRegex = new RegExp(searchStr, 'g');
    var reverseStrRegex = reverse ? new RegExp(searchStr.split('').reverse().join(''), 'g') : null;

    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {
            var line = (rows[y] || []).join('').replace(/\s/g, '');

            var count = (line.match(strRegex) || []).length;
            if (count === 0 && reverseStrRegex) {
                count = (line.match(reverseStrRegex) || []).length;
            }
            result += count;
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
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, errorMessage);
        });

        pdfParser.on('pdfParser_dataReady', function (pdfData) {
            var totalPages = pdfData.formImage.Pages.length;
            if (pageNum && totalPages < pageNum - 1) {
                throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${totalPages} pages`);
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
        var text = decodeURIComponent(item.R[0].T);
        // accumulate text items into rows object, per line
        (rows[item.y] = rows[item.y] || []).push(text);
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
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, errorMessage);
        });

        pdfParser.on('pdfParser_dataReady', function (pdfData) {
            let totalPages = pdfData.formImage.Pages.length;
            if (pageNum && totalPages < pageNum - 1) {
                throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${totalPages} pages`);
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
        throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
    }
}

function validatePageNum(arg, name) {
    if (arg === null || (arg && typeof arg === 'number' && arg > 0)) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
    }
}

function validateMessage(arg, name) {
    if (arg === null || (arg && typeof arg === 'string' && arg.trim().length > 0)) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-empty string.");
    }
}

function validateReverse(arg, name) {
    if (arg === null || (typeof arg !== 'undefined' && typeof arg === 'boolean')) {
        // pageNum is correct
    } else {
        throw new OxError(errHelper.ERROR_CODES.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a boolean");
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

const MODULE_NAME = 'pdf';

export default class PdfModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        // pre-initialize the module
        this._isInitialized = true;
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "http".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Asserts that text is present in a PDF file
     * @function assert
     * @param {String} pdfFilePath - Relative or absolute path to the PDF file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     */
    async assert(pdfFilePath, text, pageNum = null, message = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, this.options);

        let error;
        try {
            const ret = await assertion(pdfFilePath, text, pageNum, reverse);

            if (!ret) {
                if (message) {
                    throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, message);
                }

                let msg = `"${text}" is not found in the PDF ${pageNum ? 'on page ' + pageNum : ''}`;
                throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, msg);
            }

        } catch (e) {
            error = new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }

        if (error) {
            throw error;
        }

    }

    /**
     * @summary Asserts that text is not present in a PDF file
     * @function assertNot
     * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     */
    async assertNot(pdfFilePath, text, pageNum = null, message = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, this.options);

        let error;
        try {
            const ret = await assertion(pdfFilePath, text, pageNum, reverse);

            if (ret) {
                if (message) {
                    throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, message);
                }

                let msg = `"${text}" is found in the PDF ${pageNum ? 'on page ' + pageNum : ''}`;
                throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, msg);
            }
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.ASSERT_ERROR, e.message);
        }

        if (error) {
            throw error;
        }
    }

    /**
     * @summary Count the number of times specified text is present in a PDF file.
     * @function count
     * @param {String} pdfFilePath - Relative or absolute path to the pdf file.
     * @param {String} text - Text to count.
     * @param {Number=} pageNum - Page number.
     * @param {Boolean=} reverse - Check also reverse variant of string.
     * @return {Number} Number of times the specified text was found.
     */
    async count(pdfFilePath, text, pageNum = null, reverse = false) {
        validateString(pdfFilePath, 'pdfFilePath');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateReverse(reverse, 'reverse');

        pdfFilePath = resolvePath(pdfFilePath, this.options);

        try {
            return await count(pdfFilePath, text, pageNum, reverse);
        }
        catch (e) {
            throw new OxError(errHelper.ERROR_CODES.PDF_ERROR, e.message || e);
        }
    }
}
