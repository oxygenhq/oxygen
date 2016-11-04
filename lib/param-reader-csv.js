module.exports = function () {
    var module = {};
    var csvLoader = require('csv-load-sync');
	var path = require('path');
	var defer = require('when').defer;
    var _doneReading = defer();
	
	module.read = function(filePath) {
		var ext = path.extname(filePath);
		if (ext !== '.csv' && ext !== '.txt') {
			_doneReading.reject(new Error('Unsupported file extension: ' + ext));
			return _doneReading.promise;
		}
		var table = csvLoader(filePath);
		_doneReading.resolve(table);
		
		return _doneReading.promise
	}
    
    return module;
};