/*
 * Copyright (C) 2019-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides generic methods for working with PDF files.
 */

const OxError = require('../errors/OxygenError');
const errHelper = require('../errors/helper');
var pdfreader = require('pdfreader');
var deasync = require('deasync');

function countRows(searchStr, rows) {
    let result = 0;

    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {
            var line = (rows[y] || []).join('').replace(/\s/g, '');
            var inludes = line.includes(searchStr);
            
            if(inludes){
                result++;
            }
        });

    return result;
}

function checkRows(searchStr, rows) {
    let result = false;
    
    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {

            var line = (rows[y] || []).join('').replace(/\s/g, '');
            var inludes = line.includes(searchStr);
            
            if(inludes){
                result = true;
                return true;
            }
        });

    return result;
}

function assertion(path, text, pageNum = 0){
    let rows = {}; // indexed by y-position
    let currentPage = 1;

    return new Promise(function(resolve, reject) {
        const searchStr = text.replace(/\s/g, '');

        new pdfreader.PdfReader().parseFileItems(path, function(
            err,
            item
        ) {
            if(err){
                let errorMessage = 'unexpected PdfReader error';
                if(err.data && err.data.message){
                    errorMessage = err.data.message;
                }
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, errorMessage );
            }

            if (item && item.page) {
                currentPage = item.page - 1;
                let hold = true;

                if(pageNum){
                    if(currentPage && parseInt(currentPage) === parseInt(pageNum)){
                        // hold
                    } else {
                        hold = false;
                    }
                }

                if(hold && currentPage > 0){
                    let result = checkRows(searchStr, rows);

                    if(result){
                        resolve(true);
                    }
                }

                rows = {}; // clear rows for next page
            } else if (item && item.text) {
                // accumulate text items into rows object, per line
                (rows[item.y] = rows[item.y] || []).push(item.text);
            } else {
                if(typeof item === 'undefined'){
                    // end of file
                    let hold = true;
                    currentPage++;

                    if(pageNum){
                        if(pageNum > currentPage){
                            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${currentPage} pages`);
                        } else if(currentPage && parseInt(currentPage) === parseInt(pageNum)){
                            // hold
                        } else {
                            hold = false;
                        }
                    }

                    if(hold && currentPage > 0){

                        //check in the last page
                        let result = checkRows(searchStr, rows);
                    
                        if(result){
                            resolve(true);
                        }
                    }
                    
                    resolve(false);
                }
            }
        });
    });
}

function count(path, text, pageNum = 0){
    let rows = {}; // indexed by y-position
    let currentPage = 1;
    let totalResult = 0;

    return new Promise(function(resolve, reject) {
        const searchStr = text.replace(/\s/g, '');

        new pdfreader.PdfReader().parseFileItems(path, function(
            err,
            item
        ) {
            if(err){
                let errorMessage = 'unexpected PdfReader error';
                if(err.data && err.data.message){
                    errorMessage = err.data.message;
                }
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, errorMessage );
            }

            if (item && item.page) {
                currentPage = item.page - 1;
                let hold = true;

                if(pageNum){
                    if(currentPage && parseInt(currentPage) === parseInt(pageNum)){
                        // hold
                    } else {
                        hold = false;
                    }
                }

                if(hold && currentPage > 0){

                    //check in the last page
                    let result = countRows(searchStr, rows);

                    if(result && result > 0){
                        totalResult+=result;
                    }
                }

                rows = {}; // clear rows for next page
            } else if (item && item.text) {
                // accumulate text items into rows object, per line
                (rows[item.y] = rows[item.y] || []).push(item.text);
            } else {
                if(typeof item === 'undefined'){
                    // end of file
                    
                    let hold = true;
                    currentPage++;
                    
                    if(pageNum){
                        if(pageNum > currentPage){
                            throw new OxError(errHelper.errorCode.SCRIPT_ERROR, `Invalid argument - 'pageNum' is ${pageNum}, but PDF contains only ${currentPage} pages`);
                        } else if(currentPage && parseInt(currentPage) === parseInt(pageNum)){
                            // hold
                        } else {
                            hold = false;
                        }
                    }

                    if(hold && currentPage > 0){

                        //check in the last page
                        let result = countRows(searchStr, rows);
                        
                        if(result && result > 0){
                            totalResult+=result;
                        }
                    }
                    
                    resolve(totalResult);
                }
            }
        });
    });
}

function validateString(arg, name) {
    if(arg && typeof arg === 'string' && arg.trim().length > 0){
        // text is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a a non-empty string.");
    }
}

function validatePageNum(arg, name) {
    if(arg === null || (arg && typeof arg === 'number' && arg > 0)){
        // pageNum is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a non-negative number.");
    }
}

function validateMessage(arg, name) {
    if(arg === null || (arg && typeof arg === 'string' && arg.trim().length > 0)){
        // pageNum is correct
    } else {
        throw new OxError(errHelper.errorCode.SCRIPT_ERROR, "Invalid argument - '" + name + "' should be a a non-empty string.");
    }
}

module.exports = function() {
    module._isInitialized = function() {
        return true;
    };

    /**
     * @summary Asserts that text is present in a PDF file
     * @function assert
     * @param {String} path - Absolute path to the PDF file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.assert = function(path, text, pageNum = null, message = null) {
        validateString(path, 'path');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');
        
        try {
            let actual = null;
            const expected = true;
            assertion(path, text, pageNum).then(
                result => {
                    actual = result;
                },
                error => {
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, error.message || error);
                }
            );
            
            deasync.loopWhile(() => { return typeof actual !== 'boolean'; });

            if(actual === expected){
                // ignore;
            } else {
                let savaMessage = text+' is not found in the PDF';

                if(pageNum){
                    savaMessage+= ` in page ${pageNum}`;
                }

                if(message){
                    // show message in result
                    savaMessage = message;
                }
                
                throw new OxError(errHelper.errorCode.ASSERT_ERROR, savaMessage);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };
    
    /**
     * @summary Asserts that text is not present in a PDF file
     * @function assertNot
     * @param {String} path - Absolute path to the pdf file.
     * @param {String} text - Text to assert.
     * @param {Number=} pageNum - Page number.
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.assertNot = function(path, text, pageNum = null, message = null) {
        validateString(path, 'path');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');
        validateMessage(message, 'message');

        try {
            let actual = null;
            const expected = false;
            assertion(path, text, pageNum).then(
                result => {
                    actual = result;
                },
                error => {
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, error.message || error);
                }
            );
            
            deasync.loopWhile(() => typeof actual !== 'boolean');
            
            if(actual === expected){
                // ignore;
            } else {
                let savaMessage = text+' is found in the PDF';

                if(pageNum){
                    savaMessage+= ` in page ${pageNum}`;
                }

                if(message){
                    // show message in result
                    savaMessage = message;
                }

                throw new OxError(errHelper.errorCode.ASSERT_ERROR, savaMessage);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };

    /**
     * @summary Count the number of times specified text is present in a PDF file.
     * @function count
     * @param {String} path - Absolute path to the pdf file.
     * @param {String} text - Text to count.
     * @param {Number=} pageNum - Page number.
     * @return {Number} Number of times the specified text was found.
     */
    module.count = function(path, text, pageNum = null) {
        validateString(path, 'path');
        validateString(text, 'text');
        validatePageNum(pageNum, 'pageNum');

        let actual = null;
        count(path, text, pageNum, true).then(
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
