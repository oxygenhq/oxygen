/*
 * Oxygen Reporter abstract class 
 */ 
var fs = require('fs');
var path = require('path');
var oxutil = require('./util');

function ReporterBase(results, options) {
    this.results = results;
    this.options = options;
}

ReporterBase.prototype.generate = function() {
    throw new Error('Abstract class, method not implemented');
};

module.exports = ReporterBase;