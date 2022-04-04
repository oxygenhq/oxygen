/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Helper module for internal Oxygen use
 */
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const crypto = require('crypto');
const util = require('util');
const password = require('../../package.json').encryptionKey;
const key = crypto.scryptSync(password, 'GfG', 24);
const iv = Buffer.alloc(16, 0);
const algorithm = 'aes-192-cbc';

import OxygenError from '../errors/OxygenError';
import errorHelper from '../errors/helper';

function DecryptResult(result) {
    const decryptResult = result;

    this.getDecryptResult = () => {
        return decryptResult;
    };
}

const DUMMY_HOOKS = {
    beforeTest: () => {},
    beforeSuite: () => {},
    beforeCase: () => {},
    beforeCommand: () => {},
    afterCommand: () => {},
    afterTest: () => {},
    afterSuite: () => {},
    afterCase: () => {},
};

var self = module.exports = {

    generateUniqueId: function() {
        return crypto.randomBytes(4).toString('hex');
    },

    getTimeStamp: function() {
        return moment.utc().valueOf();
    },

    generateTestSuiteFromJson: async function(suiteDef, testConfig, iterationCount = 1) {
        var suite = new require('../model/testsuite.js')();
        suite.id = null;
        suite.name = suiteDef.name;
        suite.id = suiteDef.id;
        suite.iterationCount = suiteDef.iterations || testConfig.iterations || iterationCount;
        const suiteFilePath = suiteDef.path || path.join(testConfig.target.cwd, 'suites', `${suiteDef.name}.json`);
        suite.paramManager = await self.getParameterManager(suiteFilePath, testConfig.parameters, testConfig.target.cwd);
        if (suite.paramManager && suite.paramManager.getMode() == 'all') {
            suite.iterationCount = suite.paramManager.rows;
        }
        suite.capabilities = suiteDef.capabilities || testConfig.capabilities || {};
        suite.environment = testConfig.environment || null;
        suite.options = testConfig.options || null;
        suite.parallel = suiteDef.parallel || testConfig.parallel || testConfig.concurrency || 1;
        // initialize each test case
        suiteDef.cases.forEach(caseDef => {
            // initialize testcase object
            const tc = new require('../model/testcase.js')();
            if (caseDef.name)
                tc.name = caseDef.name;
            else
                tc.name = self.getFileNameWithoutExt(caseDef.path);
            tc.path = self.resolvePath(caseDef.path, testConfig.target.cwd);
            tc.format = 'js';
            tc.iterationCount = caseDef.iterations || 1;
            suite.cases.push(tc);
        });
        return suite;
    },

    generateTestSuiteFromJSFile: async function (filePath, paramFile = null, paramMode = null, noParamAutoSearch = true, iterationCount = 1) {
        var fileNameNoExt = self.getFileNameWithoutExt(filePath);

        var testcase = new require('../model/testcase.js')();
        testcase.name = fileNameNoExt;
        testcase.path = filePath;
        testcase.format = 'js';
        testcase.iterationCount = 1;

        var suite = new require('../model/testsuite.js')();
        suite.name = testcase.name;
        suite.id = testcase.id;
        suite.iterationCount = iterationCount;
        suite.cases.push(testcase);
        if (testcase.reopenSession) {
            suite.reopenSession = testcase.reopenSession;
        }
        const cwd = path.dirname(filePath);
        suite.paramManager = await self.getParameterManager(filePath, { file: paramFile, mode: paramMode }, cwd);
        // if parameter reading mode is 'all' then change iterationCount to the amount of rows in the param file
        if (suite.paramManager && paramMode == 'all') {
            suite.iterationCount = suite.paramManager.rows;
        }
        return suite;
    },

    getParameterManager: async function(mainFilePath, paramOpts = null, cwd = null, autoSearch = false) {
        let paramFilePath = paramOpts && paramOpts.file ? paramOpts.file : null;
        let paramMode = paramOpts && paramOpts.mode ? paramOpts.mode : 'seq';

        if (paramFilePath && cwd && !path.isAbsolute(paramFilePath)) {
            paramFilePath = path.join(cwd, paramFilePath);
        }

        return await self.loadParameterManager(mainFilePath, paramFilePath, paramMode, autoSearch);
    },

    generateTestSuiteFromJsonFile: async function (filePath, paramFile, paramMode = null, options = {}) {
        const testConfig = {
            ...options || {},
        };
        if (paramFile) {
            testConfig.parameters = {
                file: paramFile,
                mode: paramMode,
            };
        }
        return await self.generateTestSuiteFromJson(require(filePath), testConfig);
    },

    getFileNameWithoutExt: function (filePath) {
        var fileName = path.basename(filePath);
        var fileExt = path.extname(filePath);
        var filePathNoExt = fileName.substring(0, fileName.lastIndexOf(fileExt));
        return filePathNoExt;
    },

    loadParameterManager: async function(mainFile, paramFile, paramMode, autoSearch = false) {
        var paramManager = null;
        // if param file is not specified, then check if JS file is coming in pair with a parameter file 
        // (currently supporting CSV or TXT)
        if (!paramFile && autoSearch) {
            var fileNameNoExt = self.getFileNameWithoutExt(mainFile);
            var csvParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.csv');
            var txtParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.txt');
            var xlsParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.xls');
            var xlsxParamFile = path.join(path.dirname(mainFile), fileNameNoExt + '.xlsx');

            if (fs.existsSync(csvParamFile)) {
                paramFile = csvParamFile;
            } else if (fs.existsSync(txtParamFile)) {
                paramFile = txtParamFile;
            } else if (fs.existsSync(xlsParamFile)) {
                paramFile = xlsParamFile;
            } else if (fs.existsSync(xlsxParamFile)) {
                paramFile = xlsxParamFile;
            }
        }
        if (paramFile) {
            paramManager = new require('./param-manager')(paramFile, paramMode || 'sequential');
            await paramManager.init();
            return paramManager;
        }
        return null;
    },

    resolvePath: function(pathToResolve, baseFolder) {
        if (path.isAbsolute(pathToResolve))
            return pathToResolve;
        return path.resolve(baseFolder, pathToResolve);
    },

    makeSerializable: function(err) {
        if (typeof err === 'object') {
            return destroyCircular(err, []);
        }
        return err;

        // https://github.com/jonpacker/destroy-circular
        function destroyCircular(from, seen) {
            var to = Array.isArray(from) ? [] : {};
            seen.push(from);
            Object.keys(from).forEach(function(key) {
                if (!from[key] || (typeof from[key] != 'object' && !Array.isArray(from[key]))) {
                    to[key] = from[key];
                } else if (seen.indexOf(from[key]) == -1) {
                    to[key] = destroyCircular(from[key], seen.slice(0));
                } else to[key] = '[Circular]';
            });
            return to;
        }
    },

    getMethodSignature: function(moduleName, methodName, methodArgs) {
        return moduleName + '.' + methodName + '(' + self.stringify(methodArgs, 0) + ')';
    },

    /*
     * Used to serialize oxygen command parameters. Produces a non-compliant JSON serialization.
     */
    stringify: function (args, indentation = 0) {
        let str;
        try {
            str = JSON.stringify(args, (key, value) => {
                if (typeof value === 'bigint') {    // https://github.com/GoogleChromeLabs/jsbi/issues/30
                    return value.toString();
                } else if (typeof value === 'function') {
                    return value.toString();
                } else if (typeof value === 'undefined') {
                    // if undefined is inside an array then it will be serialized as null.
                    // however if we just return 'undefined' here as string, it will be enclosed in quotes.
                    // so return magic string instead and trim the quotes later on
                    return '__UNDEFINED';
                } else if (value instanceof Error) {
                    return value.toString();
                } else if (value instanceof RegExp) {
                    return '/' + value.source + '/' + value.flags;
                }
                return value;
            }, indentation);
            // trim the enclosing array and any whitespace
            str = str.replace(/^\[{1}\s*|\s*\]{1}$/g, '');
            // convert magic 'undefined' string to proper representation
            str = str.replace(/"__UNDEFINED"/g, 'undefined');
        } catch (e) {
            console.warn('Failed to serialize command arguments: ', e);
            str = e.toString();
        }
        return str;
    },

    isInDebugMode: function() {
        // this always true;
        // const argv = process.execArgv.join();

        // console.log('process.debugPort', process.debugPort);
        // console.log("argv.includes('inspect')", argv.includes('inspect'));
        // console.log("argv.includes('inspect-brk')", argv.includes('inspect-brk'));
        // console.log("argv.includes('debug')", argv.includes('debug'));

        // return process.debugPort || argv.includes('inspect') || argv.includes('inspect-brk') || argv.includes('debug');

        return false;
    },

    loadTestHooks: function(options) {
        let hooks = DUMMY_HOOKS;
        if (options && options.target && options.target.name === 'oxygen.conf') {
            try {
                hooks = require(options.target.path).hooks || DUMMY_HOOKS;
            }
            catch (e) {
                console.warn('Error loading user hooks:', e);
            }
        }
        return hooks;
    },

    executeTestHook: async function(hooks, method, args) {
        // if hook is not defined, just quietly ignore it
        if (!hooks || !method || !hooks[method] || typeof hooks[method] !== 'function') {
            return null;
        }
        try {
            if (global.chaiAndMockeryLoaded) {
                // ignore
            } else {
                const chai = require('chai');
                const mockery = require('mockery');
                mockery.enable({
                    useCleanCache: true,
                    warnOnReplace: false,
                    warnOnUnregistered: false
                });
                mockery.registerMock('chai', chai);
                global.chaiAndMockeryLoaded = true;
            }

            await hooks[method].apply(undefined, args);
        }
        catch (e) {
            console.error(`Hook "${method}" has thrown an error: ${e.toString()}`);
            throw e;
        }
    },

    getOxModulesDir: function() {
        return path.join(__dirname, '..', 'ox_modules');
    },

    hookLogs(logger) {
        const origlog = console.log;
        const origDebug = console.debug;
        const origInfo = console.info;
        const origWarn = console.warn;
        const origError = console.error;

        const processArgs = (argumentArray) => {
            let result = [];

            if (argumentArray && argumentArray.map) {
                argumentArray.map((item) => {
                    if (typeof item === 'string') {
                        result.push(`${item}`);
                    } else {
                        result.push(`${util.inspect(item)}`);
                    }
                });
            }

            return result.join(' ');
        };

        console.log = function (...argumentArray) {
            origlog.apply(this, argumentArray);
            logger.info(processArgs(argumentArray));
        };
        console.debug = function (...argumentArray) {
            origDebug.apply(this, argumentArray);
            logger.debug(processArgs(argumentArray));
        };
        console.info = function (...argumentArray) {
            origInfo.apply(this, argumentArray);
            logger.info(processArgs(argumentArray));
        };
        console.warn = function (...argumentArray) {
            origWarn.apply(this, argumentArray);
            logger.warn(processArgs(argumentArray));
        };
        console.error = function (...argumentArray) {
            origError.apply(this, argumentArray);
            logger.error(processArgs(argumentArray));
        };
    },

    makeTransactionFailedIfStepFailed(steps) {
        if (steps && steps.length && steps.length > 0) {
            let lastFindedTransactionIndex = false;
            const newSteps = [...steps];
            steps.map((item, idx) => {
                if (item.name && item.name.includes && item.name.includes('.transaction(')) {
                    lastFindedTransactionIndex = idx;
                }

                if (typeof lastFindedTransactionIndex === 'number' && item.status && item.status === 'failed') {
                    newSteps[lastFindedTransactionIndex]['status'] = 'failed';
                }
            });

            return newSteps;
        }

        return steps;
    },

    decrypt(text) {
        try {
            let encryptedText = Buffer.from(text, 'hex');
            let decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const retVal = decrypted.toString();
            return new DecryptResult(retVal);
        } catch (e) {
            throw new OxygenError(errorHelper.ERROR_CODES.CRYPTO_ERROR, "The provided argument doesn't seem to be a valid cipher produced by 'utils.encrypt'");
        }
    },

    encrypt(text) {
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    },

    sleep: function(timeout) {
        return new Promise((resolve) => setTimeout(resolve, timeout));
    }
};
