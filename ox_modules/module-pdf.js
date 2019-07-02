/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides generic pdf methods.
 */

const OxError = require('../errors/OxygenError');
const errHelper = require('../errors/helper');
var pdfreader = require('pdfreader');
var deasync = require('deasync');

function checkRows(searchStr, rows) {
    let result = false;
    
    Object.keys(rows) // => array of y-positions (type: float)
        .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
        .some(y => {
            var line = (rows[y] || []).join("");

            var inludes = line.includes(searchStr);
            
            if(inludes){
                result = true;
                return true;
            }
        });

    return result;
}

function assertion(path, text, invert = false){
    let rows = {}; // indexed by y-position

    return new Promise(function(resolve, reject) {    
        if(!path || !text){
            reject(`Bad params, path and text required, now path: ${path}, text: ${text}`);
        }
    
        const srcFilePath = path;
        const searchStr = text.split(" ").join("");

        if(srcFilePath){
            new pdfreader.PdfReader().parseFileItems(srcFilePath, function(
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
                    // end of file, or page
                    let result = checkRows(searchStr, rows);

                    if(result){
                        resolve(true);
                    }
                    
                    rows = {}; // clear rows for next page
                } else if (item && item.text) {
                    // accumulate text items into rows object, per line
                    (rows[item.y] = rows[item.y] || []).push(item.text);
                } else {
                    if(typeof item === 'undefined'){
                        resolve(false);
                    }
                }
            })
        } else {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `Error when try to get full path fron path: ${path}`);
        }
    })
}


module.exports = function() {
    module._isInitialized = function() {
        return true;
    };

    /**
     * @summary Asserts that text are in pdf file
     * @function assert
     * @param {String} path - Absolute path to pdf file.
     * @param {String} text - Expected value. Either a verbatim string
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.assert = function(path, text, message) {
        try {
            if(path && text){
                let actual = null;
                const expected = true;
                assertion(path, text).then(
                    result => {
                        actual = result;
                    },
                    error => {
                        throw new OxError(errHelper.errorCode.ASSERT_ERROR, error.message || error);
                    }
                  )
                
                deasync.loopWhile(() => { return typeof actual !== 'boolean'; });

                if(actual === expected){
                    // ignore;
                } else {
                    let savaMessage = text+' is not found in the PDF';
    
                    if(message){
                        // show message in result
                        savaMessage = message;
                    }
                    
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, savaMessage);
                }
            } else {
                let message = 'Bad params, path and text required, now';

                if(!path){
                    message += ` path: ${path ? path : 'empty line'}`;
                }

                if(!text){
                    if(!path){
                        message += ',';
                    }

                    message += ` text: ${text ? text : 'empty line'}`;
                }

                throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };
    
    
    /**
     * @summary Asserts that text are not in pdf file
     * @function assert
     * @param {String} path - Absolute path to pdf file.
     * @param {String} text - Expected value. Either a verbatim string
     * @param {String=} message - Message to throw if assertion fails.
     */
    module.assertNot = function(path, text, message) {
        try {
            if(path && text){
                let actual = null;
                const expected = false;
                assertion(path, text).then(
                    result => {
                        actual = result;
                    },
                    error => {
                        throw new OxError(errHelper.errorCode.ASSERT_ERROR, error.message || error);
                    }
                  )
                
                deasync.loopWhile(() => typeof actual !== 'boolean');
                
                if(actual === expected){
                    // ignore;
                } else {
                    let savaMessage = text+' is found in the PDF';
    
                    if(message){
                        // show message in result
                        savaMessage = message;
                    }
    
                    throw new OxError(errHelper.errorCode.ASSERT_ERROR, savaMessage);
                }
            } else {
                let message = 'Bad params, path and text required, now';

                if(!path){
                    message += ` path: ${path ? path : 'empty line'}`;
                }

                if(!text){
                    if(!path){
                        message += ',';
                    }

                    message += ` text: ${text ? text : 'empty line'}`;
                }

                throw new OxError(errHelper.errorCode.ASSERT_ERROR, message);
            }
        }
        catch (e) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, e.message);
        }
    };

    return module;
}