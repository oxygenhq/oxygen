/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Excel Reporter
 */
import path from 'path';
import _ from 'lodash';
import xlsx from 'xlsx';

import FileReporterBase from '../lib/reporter/FileReporterBase';

const DEFAULT_TEMPLATE_PATH = './excel/template.json';
const DEFAULT_SHEET_NAME = 'Sheet1';
const DEFAULT_EXTENSION = '.xlsx';
const EXCEL_COLUMNS = generateExcelColumns();

export default class ExcelReporter extends FileReporterBase {
    constructor(options) {
        super(options)
    }

    generate(results) {
        var resultFilePath = this.createFolderStructureAndFilePath(DEFAULT_EXTENSION);
        var resultFolderPath = path.dirname(resultFilePath);
        var rows = [];

        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        for (let result of results) {
            for (let suiteResult of result.suites) {
                generateRowsForSuite(suiteResult, rows);
            }
        }
        // generate workbook based on either user-defined or default template
        var templatePath = this.options.template || DEFAULT_TEMPLATE_PATH;
        var workbook = generateWorksheetFromTemplate(templatePath, rows, this.options);
        // write to file
        xlsx.writeFile(workbook, resultFilePath, { bookSST: false });

        return resultFilePath;
    }
}

function generateRowsForSuite(suiteResult, rows) {
    for (let caseResult of suiteResult.cases) {
        let lastFailedStep = null;
        for (let step of caseResult.steps) {
            if (step.status === 'failed') {
                lastFailedStep = step;
            }
            else {
                lastFailedStep = null;
            }
        }
        // convert each iteration to a row in Excel file
        rows.push(addValues(suiteResult, caseResult, lastFailedStep));
    }
}

function generateWorksheetFromTemplate(templatePath, rows, options) {
    var template = null;
    try {
        template = require(templatePath);
    } catch (e) {
        throw new Error('Excel reporter template file is not found or is in invalid format: ' + templatePath + '. Error: ' + e.message);
    }
    var wb = new Workbook();
    var ws = {};
    var wsName = options.sheetName || DEFAULT_SHEET_NAME;
    wb.SheetNames.push(wsName);
    wb.Sheets[wsName] = ws;
    var column = 0;
    var row;
    var header;
    var cellAddress;
    
    // generate headers row         
    for (var h = 0; h < template.length; h++) {
        header = template[h];

        // if header's value is param.all or var.all then generate columns for each parameter/variable automatically
        if (header.value === '${param.all}' && rows && rows.length && rows.length > 0) {
            // read parameter names from the first iteration, assuming parameter names remain the same for all iterations
            row = rows[0];
            _.each(row.param, function(value, name) {
                cellAddress = EXCEL_COLUMNS[column] + '1';
                ws[cellAddress] = {};
                ws[cellAddress].v = name;
                column++;
            });
        } else if (header.value === '${var.all}' && rows && rows.length && rows.length > 0) {
            // read variable names from the first iteration, assuming variable names remain the same for all iterations
            row = rows[0];
            _.each(row.var, function(value, name) {
                cellAddress = EXCEL_COLUMNS[column] + '1';
                ws[cellAddress] = {};
                ws[cellAddress].v = name;
                column++;
            });
        } else {
            cellAddress = EXCEL_COLUMNS[column] + '1';
            ws[cellAddress] = {};
            ws[cellAddress].v = header.header;
            column++;
        }
    }
    
    var totalColumns = column;
    
    // generate data rows
    for (var r = 0; r < rows.length; r++) {
        column = 0;
        for (var c = 0; c < template.length; c++) {
            row = rows[r];
            header = template[c];
            // if header's value is param.all or var.all then generate columns for each parameter/variable automatically
            if (header.value === '${param.all}') {
                if (!row.param || !row.param) {
                    continue;
                }
                _.each(row.param, function(value, name) {
                    cellAddress = EXCEL_COLUMNS[column] + (r + 2);
                    ws[cellAddress] = {};
                    ws[cellAddress].v = value;
                    column++;
                });
            } else if (header.value === '${var.all}') {
                if (!row.var || !row.var) {
                    continue;
                }
                _.each(row.var, function(value, name) {
                    cellAddress = EXCEL_COLUMNS[column] + (r + 2);
                    ws[cellAddress] = {};
                    ws[cellAddress].v = value;
                    column++;
                });
            } else {
                cellAddress = EXCEL_COLUMNS[column] + (r + 2);
                ws[cellAddress] = {};
                ws[cellAddress].v = substractParameter(header.value, row) || undefined;
                column++;
            }
        }
    }
    // set worksheet range
    if (template.length > 0 && rows.length > 0) {
        ws['!ref'] = 'A1:' + EXCEL_COLUMNS[template.length - 1 + totalColumns] + (rows.length + 1);
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

function addValues(suiteResult, caseResult, lastFailedStep) {
    var values = {};
    values['suite.name'] = suiteResult.name;
    values['suite.iteration'] = suiteResult.iterationNum;
    values['suite.status'] = suiteResult.status;
    values['case.name'] = caseResult.name;
    values['case.iteration'] = caseResult.iterationNum;    
    values['case.status'] = caseResult.status;

    if (lastFailedStep) {
        values['failure.step'] = lastFailedStep.name;
        if (lastFailedStep._screenshotFile) {
            values['failure.screenshot'] = lastFailedStep.screenshotFile;
        }
        if (lastFailedStep.failure) {
            values['failure.message'] = lastFailedStep.failure.message;
            values['failure.type'] = lastFailedStep.failure.type;
            if (lastFailedStep.failure.location) {
                values['failure.location'] = lastFailedStep.failure.location;
            }
        }

    }
    values.param = {};
    _.each(caseResult.context.params, function(value, key) {
        values.param[key] = value;
    });
    values.var = {};
    _.each(caseResult.context.vars, function(value, key) {
        values.var[key] = value;
    });
    values.cap = {};
    _.each(caseResult.context.caps, function(value, key) {
        values.cap[key] = value;
    });

    return values;
}

/* dummy workbook constructor */
function Workbook() {
    this.SheetNames = [];
    this.Sheets = {};
}

function generateExcelColumns() {
    var output = [];
    for (var i='A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++)
        output.push(String.fromCharCode(i));
    return output;
}

