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
    var csvLoader = require('csv-load-sync');
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
        var table = csvLoader(filePath);
        _doneReading.resolve(table);

        return _doneReading.promise;
    };

    return module;
};
