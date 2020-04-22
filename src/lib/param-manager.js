/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import OxError from '../errors/OxygenError';
module.exports = function (filePath, mode, fileType /*optional*/) {
    var defer = require('when').defer;
    var path = require('path');
    var ExcelReader = require('./param-reader-excel');
    var CsvReader = require('./param-reader-csv');    
    var JsonReader = require('./param-reader-json');    
    var errHelper = require('../errors/helper');
    var module = {};
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
        else if (ext === '.json' || ext === '.js') {
            reader = new JsonReader();
        }
        else {
            _whenInitialized.reject(new OxError(errHelper.errorCode.PARAMETERS_ERROR, 'Unsupported parameters file type: ' + ext));
            return _whenInitialized.promise;
        }

        this.mode = mode;

        reader.read(filePath, fileType || null)
            .then(function(result) {
                self.table = result;
                // initialize currentRow according with parameter reading mode (random or sequential)
                self.currentRow = self.mode === 'random' ? random(0, self.table.length) : 0;
                _whenInitialized.resolve(null);
            })
            .catch(function(err) {
                _whenInitialized.reject(err);
            });

        return _whenInitialized.promise;
    };

    module.getMode = function() {
        return this.mode;
    };

    module.readNext = function () {
        if (this.mode === 'random') {
            this.currentRow = random(0, this.table.length);
        } else {
            this.currentRow++;
        }

        if (this.currentRow > this.table.length - 1) {
            this.currentRow = 0;
        }
    };

    module.getValues = function() {
        if (!this.table || this.table.length === 0) {
            throw new OxError(errHelper.errorCode.PARAMETERS_ERROR, 'Parameters table is empty');
        }
        return this.table[this.currentRow];
    };

    module.__defineGetter__('rows', function(){
        return this.table.length;
    });

    function random(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    return module;
};
