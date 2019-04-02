/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

module.exports = function () {
    var module = {};
    var XLSX = require('xlsx');
    var fs = require('fs');
    var path = require('path');
    var defer = require('when').defer;
    var _doneReading = defer();

    module.read = function(filePath, extOverride) {
        var ext = path.extname(filePath);
        if (extOverride) {
            ext = extOverride;
        }
        if (ext !== '.csv' && ext !== '.txt') {
            _doneReading.reject(new Error('Unsupported file extension: ' + ext));
            return _doneReading.promise;
        }

        var data;
        try {
            data = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            _doneReading.reject(new Error('Unable to read parameters file: ' + e));
            return _doneReading.promise;
        }
        var wb = XLSX.read(data, { type: "string" });
        var table = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1, {raw: false});

        _doneReading.resolve(table);

        return _doneReading.promise;
    };

    return module;
};
