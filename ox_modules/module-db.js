/**
 * Provides methods for working with Data Bases through ODBC.
 */

module.exports = function(argv, context, rs, logger, dispatcher) {
    var module = { modType: 'dotnet' };
    if (dispatcher) {
        dispatcher.execute('db', 'moduleInit', argv);
    }

    /**
    * @summary Sets DB connection string to be used by other methods. 
    * @description This method doesn't actually open the connection as it's opened/closed 
    *              automatically by query methods.<br/>
    *              Example connection strings:<br/>
    *              <ul>
    *              <li><code>Driver={MySQL ODBC 5.3 UNICODE Driver};Server=localhost;
    *               Database=myDatabase;User=myUsername;Password=myPassword;Option=3;</code>
    *              </li>
    *              <li><code>Driver={Oracle in instantclient_11_2};dbq=127.0.0.1:1521/XE;
    *              uid=myUsername;pwd=myPassword;</code></li>
    *              </ul>
    * @function setConnectionString
    * @param {String} connString - ODBC connection string.
    */
    module.setConnectionString = function() { return dispatcher.execute('db', 'setConnectionString', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Executes SQL query and returns the first column of the first row in the result set.
     * @function getScalar
     * @param {String} query - The query to execute.
     * @return {Object} The first column of the first row in the result set, or null if the result 
     *                  set is empty.
     */
    module.getScalar = function() { return dispatcher.execute('db', 'getScalar', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Executes SQL statement.
     * @function executeNonQuery
     * @param {String} query - The query to execute.
     */
    module.executeNonQuery = function() { return dispatcher.execute('db', 'executeNonQuery', Array.prototype.slice.call(arguments)); };

    return module;
};