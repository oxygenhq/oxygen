/*
 * Oxygen Excel Reporter  
 */ 
var path = require('path');
var fs = require('fs');
var _ = require('underscore');

var ReporterFileBase = require('../reporter-file-base'); 
var util = require('util');
util.inherits(ExcelReporter, ReporterFileBase);


function ExcelReporter(results, options) {
	ExcelReporter.super_.call(this, results, options);
}

ExcelReporter.prototype.generate = function() {
	var resultFilePath = this.createFolderStructureAndFilePath('.xsl');
	var resultFolderPath = path.dirname(resultFilePath);
	var rows = [];
	var paramNames = {};
	
	this.replaceScreenshotsWithFiles(resultFolderPath);
	// go through all interations
	_.each(this.results, function(resultSet) {
		_.each(resultSet.iterations, function(outerIt) {
			_.each(outerIt.testcases, function(testcase) {
				_.each(testcase.iterations, function(innerIt) {
					// extract all parameter names to a separate hash table
					// it will be later used to generate Excel table headers
					if (innerIt.context && innerIt.context.params) {
						_.each(innerIt.context.params, function(value, key) {
							if (!_.has(paramNames, key))
								paramNames[key] = null;
						});
					}
					var lastFailedStep = null;
					_.each(innerIt.steps, function(step) {
						if (step._status === 'failed') {
							lastFailedStep = step;
						}
					});
					// convert each iteration to a row in Excel file
					rows.push(addValues(resultSet, outerIt, testcase, innerIt, lastFailedStep));
				});
			});
		})
	});
	// TODO: save rows to the Excel file
	// TODO: if template is specified, use headers defined in the template
	console.dir(rows);
    
	return resultFilePath;
}

function addValues(resultSet, outerIt, testcase, innerIt, lastFailedStep) {
	var values = {};
	values['suite.iteration'] = outerIt._iterationNum;
	values['suite.status'] = outerIt._status;
	values['case.iteration'] = innerIt._iterationNum;
	values['case.name'] = testcase._name;
	values['case.status'] = innerIt._status;
	if (lastFailedStep) {
		values['failure.step'] = lastFailedStep._name;
		if (lastFailedStep._screenshotFile) {
			values['failure.screenshot'] = lastFailedStep._screenshotFile;
		}
		if (lastFailedStep.failure) {
			values['failure.message'] = lastFailedStep.failure._message;
			values['failure.type'] = lastFailedStep.failure._type;
			if (lastFailedStep.failure.data && lastFailedStep.failure.data.line) {
				values['failure.line'] = lastFailedStep.failure.data.line;	
			}
		}
		
	}
	_.each(innerIt.context.params, function(value, key) {
		values["params.'" + key + "'"] = value;
	});
	return values;
}

module.exports = ExcelReporter;