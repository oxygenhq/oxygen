/*
 * Oxygen Excel Reporter  
 */ 
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var xlsx = require('xlsx');

var ReporterFileBase = require('../reporter-file-base'); 
var util = require('util');
util.inherits(ExcelReporter, ReporterFileBase);

const DEFAULT_TEMPLATE_PATH = './excel/template.json';
const DEFAULT_SHEET_NAME = 'Sheet1';
const DEFAULT_EXTENSION = '.xlsx';
const EXCEL_COLUMNS = generateExcelColumns();

function ExcelReporter(results, options) {
	ExcelReporter.super_.call(this, results, options);
}

ExcelReporter.prototype.generate = function() {
	var resultFilePath = this.createFolderStructureAndFilePath(DEFAULT_EXTENSION);
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
	var templatePath = this.options.template || DEFAULT_TEMPLATE_PATH;
	var workbook = generateWorksheetFromTemplate(templatePath, rows, this.options);
	console.dir(workbook);
	
	xlsx.writeFile(workbook, resultFilePath);
    
	return resultFilePath;
}

function generateWorksheetFromTemplate(templatePath, rows, options) {
	var template = null;
	try {
		template = require(templatePath);	
	}
	catch (e) {
		console.error(e);
		console.log(e.stack);
		throw new Error('Excel reporter template file is not found or is in invalid format: ' + templatePath);
	}
	var wb = new Workbook();
	var ws = {};
	var wsName = options.sheetName || DEFAULT_SHEET_NAME;
	wb.SheetNames.push(wsName);
	wb.Sheets[wsName] = ws;
	// add headers row
	for (var h=0; h<template.length; h++) {
		var header = template[h];
		var cellAddress = EXCEL_COLUMNS[h] + '1';
		ws[cellAddress] = {};
		ws[cellAddress].v = header.header;
	}
	// add data rows
	for (var r=0; r<rows.length; r++) {
		for (var h=0; h<template.length; h++) {
			var row = rows[r];
			var header = template[h];
			var cellAddress = EXCEL_COLUMNS[h] + (r + 2);
			ws[cellAddress] = {};
			ws[cellAddress].v = row[header.header] || null;
		}
	}
	return wb;
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
	values.param = {};
	_.each(innerIt.context.params, function(value, key) {
		values.param[key] = value;
	});
	return values;
}

/* dummy workbook constructor */
function Workbook() {
	//if(!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}

function generateExcelColumns() {
	var output = []; 
	for(var i='A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++)
		output.push(String.fromCharCode(i)); 
	return output;
}
module.exports = ExcelReporter;