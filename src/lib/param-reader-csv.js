/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

module.exports = function () {
    var module = {};
    const parse = require('csv-parse/lib/sync');
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

        // CSVs produced by OS X Excel have header terminated with 0d0d0a
        data = data.replace(/\r\r/g, '\r');

        // strip BOM for UTF-8
        var bom = false;
        // catches 0xEFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to 0xFEFF (UTF-16 BOM)
        if (data.charCodeAt(0) === 0xFEFF) {
            bom = true;
        }

        data = data.trim();

        const dataSplit = data.split('\r\n');

        const header = dataSplit.shift();

        let headerSplit = header.split(',');
        
        headerSplit = headerSplit.map((item) => item.trim());

        headerSplit = headerSplit.join(',');

        dataSplit.unshift(headerSplit);

        data = dataSplit.join('\r\n');
        
        var table = parse(data, { bom: bom, columns: true });

        _doneReading.resolve(table);

        return _doneReading.promise;
    };

    return module;
};
