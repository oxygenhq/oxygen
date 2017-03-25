module.exports = function () {
    var module = {};
    var xlsx = require('xlsx');
    var defer = require('when').defer;
    var path = require('path');
    var _doneReading = defer();
    
    // asynchronously reads Excel file and returns json that represents the first sheet
    module.read = function(filePath) {
        var ext = path.extname(filePath);
        if (ext !== '.xlsx' && ext !== '.xls') {
            _doneReading.reject(new Error('Unsupported file extension: ' + ext));
            return _doneReading.promise;
        }
        
        var json;
        try {
            var workbook = xlsx.readFile(filePath);
            var sheetNameList = workbook.SheetNames;
            json = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
        } catch (err) {
            _doneReading.reject(err);
        }
        
        _doneReading.resolve(json);
        return _doneReading.promise;
    };
    
    return module;
};