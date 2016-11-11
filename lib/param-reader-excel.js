module.exports = function () {
    var module = {};
	var xlsxtojson = require("xlsx-to-json-lc");
	var xlstojson = require("xls-to-json-lc");
	var defer = require('when').defer;
	var path = require('path');
	var _doneReading = defer();
    
	// asynchronously reads Excel file and returns json that represents the first sheet
	module.read = function(filePath, extOverride) {
		var converter = null;
		var ext = path.extname(filePath);
		if (extOverride) {
			ext = extOverride;
		}

		// choose the right converter based on either xls or xlsx file extension 
		if (ext === '.xlsx') {
			converter = xlsxtojson;
		}
		else if (ext === '.xls'){
			converter = xlstojson;
		}
		else {
			_doneReading.reject(new Error('Unsupported file extension: ' + ext));
			return _doneReading.promise;
		}
		converter(
			{
				input: filePath, // path to the xlsx file
				output: null, //since we don't need output.json
				lowerCaseHeaders:true
			}, 
			function(err,result){
				if(err) {
					_doneReading.reject(err);
				} 
				else {
					_doneReading.resolve(result);
				}
			}
		);
		return _doneReading.promise
	}
    
    return module;
};