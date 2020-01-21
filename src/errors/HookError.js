/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Oxygen test hook thrown an error
 */
import OxygenError from './OxygenError';

export default class HookError extends OxygenError {
    constructor(message, err, isFatal = true) {
        super('HOOK_ERROR', message, null, isFatal, err);
    }
}