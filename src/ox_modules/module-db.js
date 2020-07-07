/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @name db
 * @description Provides methods for working with Data Bases through ODBC.
 * @note Before using this module, make sure to install `unixodbc`:  
 *   * Windows - Install `Windows SDK`  
 *   * OS X -  `brew install unixodbc`  
 *   * Linux - `sudo apt-get install unixodbc unixodbc-dev` or `sudo dnf install unixODBC unixODBC-devel`
 */

var connection;

import OxError from '../errors/OxygenError';
var errHelper = require('../errors/helper');

module.exports = function() {
    // FIXME: change setConnectionString to init and add hadnling in here
    module.isInitialized = function() {
        return true;
    };

    module._openDbConn = async function() {
        if (!this.connString) {
            throw new OxError(errHelper.errorCode.DB_CONNECTION_ERROR, 'No connection string specified. Use db.setConnectionString().');
        }

        try {
            // ignore this module if odbc wasn't installed
            var db;
            try {
                db = require('odbc');
            } catch (e) {
                // could happen only on unix due to missing unixodbc binaries
                const ModuleUnavailableError = require('../errors/ModuleUnavailableError');
                throw new ModuleUnavailableError('`unixodbc` binaries not installed');
            }

            connection = await db.connect(this.connString);
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
    module.getScalar = async function(query) {
        await module._openDbConn();
        try {
            var resultSet = await connection.query(query);
            if (resultSet.length === 0) {
                return null;
            }
            var firstRow = resultSet[0];
            var firstCol = firstRow[Object.keys(firstRow)[0]];
            return firstCol;
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, e.message);
        } finally {
            await connection.close();
        }
    };

    /**
     * @summary Executes SQL query and returns the result set.
     * @function executeQuery
     * @param {String} query - The query to execute.
     * @return {Object} The result set.
     */
    module.executeQuery = async function(query) {
        await module._openDbConn();
        try {
            const querySyncRetval = await connection.query(query);
            return querySyncRetval;
        } catch (e) {
            const errorMessage = errHelper.getDbErrorMessage(e);

            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, errorMessage);
        } finally {
            await connection.close();
        }
    };

    /**
     * @summary Executes SQL statement.
     * @description Any results from the query are discarded.
     * @function executeNonQuery
     * @param {String} query - The query to execute.
     */
    module.executeNonQuery = async function(query) {
        await module._openDbConn();
        try {
            await connection.query(query);
        } catch (e) {
            throw new OxError(errHelper.errorCode.DB_QUERY_ERROR, e.message);
        } finally {
            await connection.close();
        }
    };

    return module;
};
