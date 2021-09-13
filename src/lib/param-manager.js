/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import OxError from '../errors/OxygenError';

// const defer = require('when').defer;
const path = require('path');
const ExcelReader = require('./param-reader-excel');
const CsvReader = require('./param-reader-csv');
const JsonReader = require('./param-reader-json');
const errHelper = require('../errors/helper');

const DEFAULT_MODE = 'seq';

export default class ParameterManager {
    constructor({ filePath = null, fileType = null, mode = DEFAULT_MODE, values = null}) {
        this.mode = mode || DEFAULT_MODE;
        this.filePath = filePath;
        this.fileType = fileType;
        this.mode = mode;
        this.table = null;
        this.currentRow = null;
        this.prevRow = null;
        // if values were provided, initialize manager with pre-defined table
        if (values && Array.isArray(values)) {
            this.table = values;
            // initialize currentRow according with parameter reading mode (random or sequential)
            this.currentRow = this.mode === 'random' ? random(0, this.table.length) : 0;
        }
    }

    async init() {
        if (!this.filePath) {
            return;
        }
        let ext = path.extname(this.filePath);

        if (this.fileType) {
            ext = this.fileType;
        }
        let reader = null;
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
            new OxError(errHelper.errorCode.PARAMETERS_ERROR, `Unsupported parameters file type: ${ext}`);
            return;
        }

        try {
            const result = await reader.read(this.filePath, this.fileType || null);
            this.table = result;
            // initialize currentRow according with parameter reading mode (random or sequential)
            this.currentRow = this.mode === 'random' ? random(0, this.table.length) : 0;
        }
        catch (e) {
            new OxError(
                errHelper.errorCode.PARAMETERS_ERROR,
                `${errHelper.errorCode.PARAMETERS_ERROR}: Unable to load parameters file.\n${e.message}`
            );
        }
    }
    getMode() {
        return this.mode;
    }

    readNext() {
        this.prevRow = this.currentRow;
        if (this.mode === 'random') {
            this.currentRow = random(0, this.table.length);
        } else {
            this.currentRow++;
        }

        if (this.currentRow > this.table.length - 1) {
            this.currentRow = 0;
        }
    }

    readPrev() {
        if (typeof this.prevRow !== 'undefined' && this.prevRow != null) {
            this.currentRow = this.prevRow;
        }
    }

    getValues() {
        if (!this.table || this.table.length === 0) {
            throw new OxError(errHelper.errorCode.PARAMETERS_ERROR, 'Parameters table is empty');
        }
        return this.table[this.currentRow];
    }

    get rows() {
        return this.table.length;
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}