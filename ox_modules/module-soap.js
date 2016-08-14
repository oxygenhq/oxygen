/**
 * Provides methods for working with SOAP based Web Services.
 * <br /><br />
 * NOTE: Multi-argument calls are not supported yet.
 */
module.exports = function(argv, context, rs, logger, dispatcher, handleStepResult) {
	var module = { modType: "dotnet" };
    
	var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store
    
    /**
     * @summary Initiates a SOAP request and returns the response.
     * @function get
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get = function() { return handleStepResult(dispatcher.execute('soap', 'get', Array.prototype.slice.call(arguments)), rs); };
    /**
     * @summary Initiates a SOAP 1.2 request and returns the response.
     * @function get12
     * @param {String} wsdlUrl - URL pointing to the WSDL XML.
     * @param {String} serviceName - Service name (case sensitive).
     * @param {String} methodName - Method name (case sensitive).
     * @param {Array=} args - Array of arguments.
     * @return {String} JSON representing the response object.
     */
    module.get12 = function() { return handleStepResult(dispatcher.execute('soap', 'get12', Array.prototype.slice.call(arguments)), rs); };
    
    return module;
};