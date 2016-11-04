module.exports = function (filePath, mode) {
    var defer = require('when').defer;
	var path = require('path');
	var ExcelReader = require('./param-reader-excel');
	var CsvReader = require('./param-reader-csv');
	var module = {};
    var table = null;
	var mode = mode;
	var currentRow = null;
	var filePath = filePath;
	var _whenInitialized = defer();
	
	module.init = function() {
		var ext = path.extname(filePath);
		var reader = null;
		var self = this;
		// choose the right converter based on either xls or xlsx file extension 
		if (ext === '.xlsx' || ext === '.xls') {
			reader = new ExcelReader();
		}
		else if (ext === '.csv' || ext === '.txt') {
			reader = new CsvReader();
		}
		else {
			_whenInitialized.reject(new Error('Unsupported file extension: ' + ext));
			return _whenInitialized.promise;
		}
		reader.read(filePath)
		 .then(function(result) {
			 self.table = result;
			 // initialize currentRow according with parameter reading mode (random or sequential)
			 self.currentRow = self.mode === 'random' ? random(0, self.table.length - 1) : 0;
			 _whenInitialized.resolve(null);
		 })
		 .catch(function(err) {
			 _whenInitialized.reject(err);
		 });
		return _whenInitialized.promise;
	}
	
    
    
    module.readNext = function () {
        if (mode === 'random') {
            currentRow = random(0, table.length - 1);
        } else {
            currentRow++;
        }
        
        if (currentRow > table.length - 1) {
            currentRow = 0;
        }
    };
    
    module.getValues = function() {
        if (!table || table.length === 0) {
            throw new Error("Paramter table is not defined or empty");
        }
        return table[currentRow];
    };
    
    module.__defineGetter__('rows', function(){
        return table.length;
    });
    
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    return module;
};