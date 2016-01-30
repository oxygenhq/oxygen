/**
 * Provides methods for working with Data Bases through ODBC.
 */
var DotNetError = require('../errors/dotnet');
module.exports = function(argv, context, rs, dispatcher) {
    var module = {};
    var moment = require('moment');
    
    var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store
    var transactionName = null;
    
    // call ModuleInit
	dispatcher.execute('db', 'moduleInit', argv); //Array.prototype.slice.call(

    /**
    * @summary Stores DB connection string to be used by other methods. 
    * @description This method doesn't actually open the connection as it's opened/closed 
    *               automatically by query methods.<br/>
    *               Example connection string: <code>Driver={MySQL ODBC 5.3 UNICODE Driver};
    *               Server=localhost;Database=myDatabase;User=myUsername;Password=myPassword;
    *               Option=3;</code>
    * @function init
    * @param {String} connString - ODBC connection string.
    */
    module.init = function() { return executeAndHandleResult('init', arguments); };
    /**
     * @summary Executes SQL query and returns the first column of the first row in the result set.
     * @function getScalar
     * @param {String} query - The query to execute.
     * @return {Object} The first column of the first row in the result set, or a null reference 
     *                  if the result set is empty.
     */
    module.getScalar = function() { return executeAndHandleResult('getScalar', arguments); };
    /**
     * @summary Executes SQL statement.
     * @function executeNonQuery
     * @param {String} query - The query to execute.
     */
    module.executeNonQuery = function() { return execMethod('db', 'executeNonQuery', Array.prototype.slice.call(arguments)); };
    
    function executeAndHandleResult(method, args)
    {
        //console.log(JSON.stringify(res));
        var startTime = moment.utc();
        var error = null;
        var failure = null;
        
        var res = dispatcher.execute('db', method, Array.prototype.slice.call(args));
        //console.dir(res);
        
        var StepResult = require('../model/stepresult');
        var step = new StepResult();
        step.$.name = 'db.' + method;
        step.$.status = res.ErrorType ? 'failed' : 'passed';
        var endTime = moment.utc();
        var duration = endTime.unix() - startTime.unix();   // duration in seconds
        step.$.duration = duration;
        rs.steps.push(step);
    
        if (res.ErrorType)
        {
            step.failure.$.type = res.ErrorType;
            step.failure.$.message = res.ErrorMessage;
            step.failure.$.details = res.ErrorDetails;
            
            throw new DotNetError(res.ErrorType, res.ErrorMessage, res.ErrorDetails);
        }
        
        return res.ReturnValue;
    }
    
    return module;
};