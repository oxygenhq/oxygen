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

export default class ScriptError extends OxygenError {
    constructor(err) {
        super();
        if (!err) {
            throw new Error('"err" argument cannot be null');
        }
        this.type = 'SCRIPT_ERROR';
        this.stack = err.stack;
        this.subtype = err.type;
        this.message = err.message;
        this.filterStackTrace();
        this.generateLocation();
    }
}