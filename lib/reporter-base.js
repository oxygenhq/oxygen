/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Reporter abstract class
 */

function ReporterBase(results, options) {
    this.results = results;
    this.options = options;
}

ReporterBase.prototype.generate = function() {
    throw new Error('Abstract class, method not implemented');
};

module.exports = ReporterBase;
