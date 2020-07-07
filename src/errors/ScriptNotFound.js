/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen script is not found.
 */
import OxygenError from './OxygenError';

export default class ScriptNotFoundError extends OxygenError {
    constructor(scriptPath) {
        super('SCRIPT_NOT_FOUND_ERROR', `Script not found: ${scriptPath}`, null, true);
    }
}