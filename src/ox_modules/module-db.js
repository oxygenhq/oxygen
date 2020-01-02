/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides methods for working with Data Bases through ODBC.
 * NOTE: before using this module, make sure to install `unixodbc` (`brew install unixodbc`) on Mac and Linux.
 */

// ignore this module if odbc wasn't installed
var db;
try {
    db = require('odbc')();
} catch (e) {
    // could happen only on unix due to missing unixodbc binaries
    const ModuleUnavailableError = require('../errors/ModuleUnavailableError');
    throw new ModuleUnavailableError('`unixodbc` binaries not installed');
}

import OxError from '../errors/OxygenError';
var errHelper = require('../errors/helper');

module.exports = function() {
    // FIXME: change setConnectionString to init and add hadnling in here
    module.isInitialized = function() {
        return true;
    };

    module._openDbConn = function() {
        if (!this.connString) {
            throw new OxError(errHelper.errorCode.DB_CONNECTION_ERROR, 'No connection string specified. Use db.setConnectionString().');
        }

        try {
            db.openSync(this.connString);
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_CONNECTION_ERROR, e.message);
        }
    };

    /**
    * @summary Sets DB connection string to be used by other methods.
    * @description This method doesn't actually open the connection as it's opened/closed
    *              automatically by query methods.  
    *              Example connection strings:  
    *              - `Driver={MySQL ODBC 5.3 UNICODE Driver};Server=localhost;Database=myDatabase;
    *                User=myUsername;Password=myPassword;Option=3;`  
    *              - `Driver={Oracle in instantclient_11_2};dbq=127.0.0.1:1521/XE;uid=myUsername;
    *                pwd=myPassword;`
    * @function setConnectionString
    * @param {String} connString - ODBC connection string.
    */
    module.setConnectionString = function(connString) {
        module.connString = connString;
    };

    /**
     * @summary Executes SQL query and returns the first column of the first row in the result set.
     * @function getScalar
     * @param {String} query - The query to execute.
     * @return {Object} The first column of the first row in the result set, or null if the result
     *                  set is empty.
     */
    module.getScalar = function(query) {
        module._openDbConn();
        try {
            var resultSet =  db.querySync(query);
            if (resultSet.length === 0) {
                return null;
            }
            var firstRow = resultSet[0];
            var firstCol = firstRow[Object.keys(firstRow)[0]];
            return firstCol;
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, e.message);
        } finally {
            db.closeSync();
        }
    };

    /**
     * @summary Executes SQL query and returns the result set.
     * @function executeQuery
     * @param {String} query - The query to execute.
     * @return {Object} The result set.
     */
    module.executeQuery = function(query) {
        module._openDbConn();
        try {
            return db.querySync(query);
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, e.message);
        } finally {
            db.closeSync();
        }
    };

    /**
     * @summary Executes SQL statement.
     * @description Any results from the query are discarded.
     * @function executeNonQuery
     * @param {String} query - The query to execute.
     */
    module.executeNonQuery = function(query) {
        module._openDbConn();
        try {
            db.querySync(query);
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, e.message);
        } finally {
            db.closeSync();
        }
    };

    return module;
};
