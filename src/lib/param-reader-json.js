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
    var path = require('path');
    var defer = require('when').defer;
    var _doneReading = defer();

    module.read = function(filePath, extOverride) {
        var ext = path.extname(filePath);
        if (extOverride) {
            ext = extOverride;
        }
        if (ext !== '.json' && ext !== '.js') {
            _doneReading.reject(new Error('Unsupported file extension: ' + ext));
        }

        try {
            const rows = require(filePath);
            if (!Array.isArray(rows)) {
                _doneReading.reject(new Error('Unsupported file content'));
            }
            _doneReading.resolve(rows);
        } catch (e) {
            _doneReading.reject(new Error('Unable to read parameters file: ' + e));
        }

        return _doneReading.promise;
    };

    return module;
};
