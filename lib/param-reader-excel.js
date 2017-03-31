/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
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
