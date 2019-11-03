/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Reporter abstract class
 */
export default class ReporterBase {
    constructor(options) {
        this.options = options;
    }
    generate(results) {
        throw new Error('Abstract class, method not implemented');
    }
}
