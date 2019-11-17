/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Used to denote JavaScript level errors in user's script: TypeError, SyntaxError, etc.
 */
import OxygenError from './OxygenError';

export default class ModuleError extends OxygenError {
    constructor(message, err, isFatal = true) {
        super('MODULE_ERROR', message, null, isFatal, err);
        /*this.stack = err && err.stack ? err.stack : null;
        this.subtype = err && err.type ? err.type : null;
        //this.filterStackTrace();
        if (!this.stack) {
            this.captureStackTrace();
        }
        this.generateLocation();
        console.log('this.location', this.location)*/
    }
}