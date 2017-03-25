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
    
    this.replaceScreenshotsWithFiles(resultFolderPath);
    // the 'results' object can contain a single test suite result or an array of multiple parallel test results
    if (this.results instanceof Array) {
        // go through multiple results
        _.each(this.results, function(resultSet) {
            generateRowsForSingleResult(resultSet, rows);
        });
    }
    else {
        generateRowsForSingleResult(this.results, rows);
    }
    // generate workbook based on either user-defined or default template
    var templatePath = this.options.template || DEFAULT_TEMPLATE_PATH;
    var workbook = generateWorksheetFromTemplate(templatePath, rows, this.options);
    // write to file
    xlsx.writeFile(workbook, resultFilePath, { bookSST: false });
        
    return resultFilePath;
}

function generateRowsForSingleResult(result, rows) {
    _.each(result.iterations, function(outerIt) {
        _.each(outerIt.testcases, function(testcase) {
            _.each(testcase.iterations, function(innerIt) {
                var lastFailedStep = null;
                _.each(innerIt.steps, function(step) {
                    if (step._status === 'failed') {
                        lastFailedStep = step;
                    }
                    else {
                        lastFailedStep = null;
                    }
                });
                // convert each iteration to a row in Excel file
                rows.push(addValues(outerIt, testcase, innerIt, lastFailedStep));
            });
        });
    });
}

function generateWorksheetFromTemplate(templatePath, rows, options) {
    var template = null;
    try {
        template = require(templatePath);   
    }
    catch (e) {
        throw new Error('Excel reporter template file is not found or is in invalid format: ' + templatePath + '. Error: ' + e.message);
    }
    var wb = new Workbook();
    var ws = {};
    var wsName = options.sheetName || DEFAULT_SHEET_NAME;
    wb.SheetNames.push(wsName);
    wb.Sheets[wsName] = ws;
    var paramsCount = 0;
    var varsCount = 0;
    // generate headers row
    for (var h=0; h<template.length; h++) {
        var header = template[h];
        // check if current header is of ${param.all} type - then generate header for all available parameter names
        if (header.value == '${param.all}' && rows && rows.length && rows.length > 0) {
            // read parameter names from the first iteration, assuming parameter names remain the same for all iterations
            var row = rows[0];  
            _.each(row.param, function(value, name) {
                var cellAddress = EXCEL_COLUMNS[h] + '1';
                ws[cellAddress] = {};
                ws[cellAddress].v = name;   
                h++;
                paramsCount++;
            });
        }
        else if (header.value == '${var.all}' && rows && rows.length && rows.length > 0) {
            // read variable names from the first iteration, assuming variable names remain the same for all iterations
            var row = rows[0];  
            _.each(row.var, function(value, name) {
                var cellAddress = EXCEL_COLUMNS[h] + '1';
                ws[cellAddress] = {};
                ws[cellAddress].v = name;   
                h++;
                varsCount++;
            });
        }
        else {
            var cellAddress = EXCEL_COLUMNS[h] + '1';
            ws[cellAddress] = {};
            ws[cellAddress].v = header.header;
        }
    }
    // generate data rows
    for (var r=0; r<rows.length; r++) {
        for (var h=0; h<template.length; h++) {
            var row = rows[r];
            var header = template[h];
            // if header's value is ${param.all} then generate columns for each parameter automatically 
            if (header.value == '${param.all}') {
                if (!row.param || !row.param) {
                    continue;
                }
                _.each(row.param, function(value, name) {
                    var cellAddress = EXCEL_COLUMNS[h] + (r + 2);
                    ws[cellAddress] = {};
                    ws[cellAddress].v = value;  
                    h++;
                });
            }
            else if (header.value == '${var.all}') {
                if (!row.var || !row.var) {
                    continue;
                }
                _.each(row.var, function(value, name) {
                    var cellAddress = EXCEL_COLUMNS[h] + (r + 2);
                    ws[cellAddress] = {};
                    ws[cellAddress].v = value;  
                    h++;
                });
            }
            else {
                var cellAddress = EXCEL_COLUMNS[h] + (r + 2);
                ws[cellAddress] = {};
                ws[cellAddress].v = substractParameter(header.value, row) || null;  
            }
        }
    }
    // set worksheet range
    if (template.length > 0 && rows.length > 0) {
        // make sure to include auto generated columns for param.all header option
        ws['!ref'] = 'A1:' + EXCEL_COLUMNS[template.length - 1 + paramsCount + varsCount] + (rows.length + 1);
    }

    return wb;
}

function substractParameter(valueDef, data) {
    if (!valueDef || !valueDef.length || valueDef.length == 0)
        return valueDef;
    // check if the value is a paramter
    if (valueDef.indexOf('${') == 0 && valueDef.indexOf('}') == valueDef.length - 1) {
        var paramName = valueDef.substring(2, valueDef.length - 1);
        if (paramName.length == 0) {
            return valueDef;
        }
        if (paramName.indexOf('param.') == 0) {
            return data.param[paramName.substring('param.'.length)];
        }
        else if (paramName.indexOf('var.') == 0) {
            return data.var[paramName.substring('var.'.length)];
        }
        else if (paramName.indexOf('cap.') == 0) {
            return data.cap[paramName.substring('cap.'.length)];
        }
        return data[paramName];
    }
    return valueDef;
}
function addValues(outerIt, testcase, innerIt, lastFailedStep) {
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
    values.var = {};
    _.each(innerIt.context.vars, function(value, key) {
        values.var[key] = value;
    });
    values.cap = {};
    _.each(innerIt.context.caps, function(value, key) {
        values.cap[key] = value;
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