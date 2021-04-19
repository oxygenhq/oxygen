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

    module.read = function(filePath, extOverride) {
        return new Promise((resolve, reject) => {
            var ext = path.extname(filePath);
            if (extOverride) {
                ext = extOverride;
            }
            if (ext !== '.csv' && ext !== '.txt') {
                reject(new Error('Unsupported file extension: ' + ext));
            }

            var data;
            try {
                data = fs.readFileSync(filePath, 'utf8');
            } catch (e) {
                reject(new Error('Unable to read parameters file: ' + e));
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

            try {
                var table = parse(data, { bom: bom, columns: true, trim: true });
            } catch (e) {
                reject(e);
            }

            resolve(table);
        });
    };

    return module;
};
