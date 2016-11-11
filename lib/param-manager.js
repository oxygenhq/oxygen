module.exports = function (filePath, mode, fileType /*optional*/) {
    var defer = require('when').defer;
	var path = require('path');
	var ExcelReader = require('./param-reader-excel');
	var CsvReader = require('./param-reader-csv');
	var module = {};
    var table = null;
	var mode = mode;
	var fileType = fileType;
	var currentRow = null;
	var filePath = filePath;
	var _whenInitialized = defer();
	
	module.init = function() {
		var ext = path.extname(filePath);

		if (fileType) {
			ext = fileType;
		}
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
		reader.read(filePath, fileType || null)
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
        if (this.mode === 'random') {
            this.currentRow = random(0, this.table.length - 1);
        } else {
            this.currentRow++;
        }
        
        if (this.currentRow > this.table.length - 1) {
            this.currentRow = 0;
        }
    };
    
    module.getValues = function() {
        if (!this.table || this.table.length === 0) {
            throw new Error("Parameter table is not defined or empty");
        }
        return this.table[this.currentRow];
    };
    
    module.__defineGetter__('rows', function(){
        return this.table.length;
    });
    
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    return module;
};