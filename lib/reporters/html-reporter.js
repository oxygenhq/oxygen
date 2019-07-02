/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen HTML Reporter
 */
var path = require('path');
var fs = require('fs');
var htmlStart;
if (process.platform === 'win32'){
    htmlStart = fs.readFileSync('./lib/reporters/html/index.html', 'utf8');
} else {
    htmlStart = fs.readFileSync(path.join(__dirname)+'/html/index.html', 'utf8');
}

var prettifyHtml = require('prettify-html');
var moment = require('moment');
var ReporterFileBase = require('../reporter-file-base');
var util = require('util');
util.inherits(HtmlReporter, ReporterFileBase);

function HtmlReporter(results, options) {
    HtmlReporter.super_.call(this, results, options);
}

function iterationsTemplate(data){
    var result = '';

    if(
        data && 
        data.iterations && 
        data.iterations.map
    ){
        data.iterations.map(function(item, index) {
            var Status = '';
            var TestCasesInnerText = '';
            var Pre = '';
            var idx = index+1;

            Status = item._status.toUpperCase() === 'FAILED' ? 'FAILED' : 'PASSED';


            if(
                item && 
                item.testcases && 
                item.testcases.map
            ) {
                item.testcases.map(function(testcase) {
                    var Name = '';
                
                    if(testcase && testcase._name){
                        Name = testcase._name;
                    }

                    var Iterations = '';
                    if(
                        testcase && 
                        testcase.iterations && 
                        testcase.iterations.map
                    ){
                        testcase.iterations.map(function(iteration) {
                            if(
                                iteration &&
                                iteration.steps && 
                                iteration.steps.map &&
                                iteration.steps.length > 0
                            ) {
                                var stepCount = 1;

                                iteration.steps.map(function(step) {
                                    var tmp = '';
                                    if(step){
                                        if(step._name){
                                            if(step._name){
                                                if(step._name.includes){

                                                    var Name = step._name;
                                                    var Failure = '';
                                                    var Transaction = '';
                                                    var Duration = '0.00 s';
                                                    var Status = '';   
                                                    var StatusLabelClass = '';                                                    

                                                    if(step._transaction){
                                                        Transaction = step._transaction;
                                                    }

                                                    if(step._duration) {
                                                        Duration = (step._duration/1000).toFixed(2) + ' s';
                                                    }

                                                    if(step._status) {
                                                        Status = step._status.toUpperCase();
                                                        
                                                        if(Status === 'FAILED'){
                                                            StatusLabelClass = 'label-danger';
                                                        } else if(Status === 'WARNING'){
                                                            StatusLabelClass = 'label-warning';
                                                        } else {
                                                            Status = 'PASSED';
                                                            StatusLabelClass = 'label-success';
                                                        }
                                                    }

                                                    if(step.failure){
                                                        if(step._screenshotFile){
                                                            Failure = `
                                                                <a target="_blank" href="${step._screenshotFile}">
                                                                    <b>${step.failure._type}</b><br/>
                                                                    ${step.failure._message ? step.failure._message : ''}
                                                                    ${step.failure._line ? 'at line' + step.failure._line : ''}
																</a>
                                                            `;
                                                        } else {
                                                            Failure = `
                                                                <b>${step.failure._type}</b><br/>
                                                                ${step.failure._message ? step.failure._message : ''}
                                                                ${step.failure._line ? 'at line ' + step.failure._line : ''}
                                                            `;
                                                        }
                                                    }

                                                    if(Name.includes('.transaction')){
                                                        // ingore
                                                    } else if(Name.includes('log.info')){
                                                        tmp += `
                                                            <td></td>
                                                            <td style="word-wrap: break-word; width: 100%; background-color: #e9f1f9;">
                                                                ${Name.substr(10).slice(0, -2)}
                                                            </td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                        `;
                                                        stepCount++;
                                                    } else if(Name.includes('log.warn')){
                                                        tmp += `
                                                            <td></td>
                                                            <td style="word-wrap: break-word; width: 100%; background-color: #f9f9e9;">
                                                                ${Name.substr(10).slice(0, -2)}
                                                            </td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                        `;
                                                        stepCount++;
                                                    } else if(Name.includes('log.error')){
                                                        tmp += `
                                                            <td></td>
                                                            <td style="word-wrap: break-word; width: 100%; background-color: #f9e9ec;">
                                                                ${Name.substr(11).slice(0, -2)}
                                                            </td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                        `;
                                                        stepCount++;
                                                    } else if(Name.includes('log.debug')){
                                                        tmp += `
                                                            <td></td>
                                                            <td style="word-wrap: break-word; width: 100%; background-color: #e9f9ee;">
                                                                ${Name.substr(11).slice(0, -2)}
                                                            </td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                            <td></td>
                                                        `;
                                                        stepCount++;
                                                    } else {
                                                        tmp += `
                                                            <td>
                                                                ${stepCount}
                                                            </td>
                                                            <td style="word-wrap: break-word; width: 100%;">
                                                                ${Name}
                                                            </td>
                                                            <td>${Transaction}</td>
                                                            <td style="word-break: break-all;">${Duration}</td>
                                                            <td style="word-break: break-all;">
                                                                <span class="label ${StatusLabelClass} label-sm">
                                                                    ${Status}
                                                                </span>
                                                            </td>
                                                            <td style="word-break: break-all;">
                                                                ${Failure}
                                                            </td>
                                                        `;
                                                        stepCount++;
                                                    }

                                                    Iterations += `<tr>${tmp}</tr>`;
                                                }
                                            }
                                        }
                                    }
                                });
                            } else {
                                if(iteration.failure){
                                    Pre =  `
                                        <pre style="background-color: #fcacac"><b>${iteration.failure._type}</b><br/>${iteration.failure._message ? iteration.failure._message : ''} ${iteration.failure._line ? 'at line ' + iteration.failure._line : ''}</pre>
                                    `;
                                }
                            }
                        })
                    }

                    var template1 = `
                        <h4>${Name}</h4>
                        <table class="table table-bordered" style="width: 100%; table-layout: fixed;">
                            <thead>
                                <tr>
                                    <th style="width: 3%;">#</th>
                                    <th style="width: 45%;">Step</th>
                                    <th style="width: 15%;">Transaction</th>
                                    <th style="width: 7%;">Duration</th>
                                    <th style="width: 7.5%;">Status</th>
                                    <th>Failure</th>
                                </tr>
                            </thead>
                            <tbody>			
                                ${Iterations}
                            </tbody>
                        </table>
                    `;
                    TestCasesInnerText += template1;
                });
            }

            var template = `
<div class="panel-group" id="accordion">
    <div class="panel panel-default iteration">
        <div class="panel-heading">
            <h3 class="panel-title">
            <a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#collapse-it${idx}">
                Iteration #${idx}</a>
                <span class="label ${Status === 'FAILED' ? 'label-danger' : 'label-success' } label-sm">
                    ${Status}
                </span>

            </h3>
        </div>
        <div id="collapse-it${idx}" class="panel-collapse collapse in">
            <div class="panel-body">
                ${Pre}
                ${TestCasesInnerText}
            </div>
        </div>
    </div>
</div>
                `;
            result+=template;
        }) 
    }

    return result;
}

HtmlReporter.prototype.generate = function() {
    var resultFilePath = this.createFolderStructureAndFilePath('.xml');
    var resultFolderPath = path.dirname(resultFilePath);

    this.replaceScreenshotsWithFiles(resultFolderPath);

    var data = this.results[0];

    var close = `
        </div>
        </body>
    </html>
    `;

    var row1

    try {

        var Status = '';
        var StartDate = '';
        var StartTime = '';
        var EndTime = '';
        var Duration = '';
        var PassedTests = 0;
        var FailedTests = 0;
        var Iterations = 0;

        var PassedTestsCases = 0;
        var FailedTestsCases = 0;

        var PassedSteps = 0;
        var FailedSteps = 0;
        var WarningSteps = 0;
        var Name = '';
        var DeviceOrBrowserName = '';
        var PlatformName = '';

        if(
            data && 
            data.summary && 
            data.summary._status &&
            data.summary._status.toUpperCase
        ) {
            Status = data.summary._status.toUpperCase() === 'FAILED' ? 'FAILED' : 'PASSED';
        }

        if(
            data && 
            data.summary && 
            data.summary._name
        ) {
            Name = data.summary._name;
        }
        

        if(
            data && 
            data.summary && 
            data.summary._startTime
        ) {
            StartDate = moment(data.summary._startTime).format('MMM DD');
            StartTime = moment(data.summary._startTime).format('HH:mm');
        }

        if(
            data && 
            data.summary && 
            data.summary._endTime
        ) {
            EndTime = moment(data.summary._endTime).format('HH:mm');
        }

        if(
            data && 
            data.summary && 
            data.summary._duration
        ) {
            Duration = (data.summary._duration/1000).toFixed(1);
        }

        
        if(
            data && 
            data.iterations && 
            data.iterations.map
        ){
            data.iterations.map(function(item) {
                Iterations++;
                
                if(item._status === 'passed'){
                    PassedTests++;
                }

                if(item._status === 'failed'){
                    FailedTests++;
                }

                if(
                    item && 
                    item.testcases && 
                    item.testcases.map
                ) {
                    item.testcases.map(function(testcase) {

                        if(
                            testcase &&
                            testcase._status
                        ){
                            if(testcase._status === 'passed'){
                                PassedTestsCases++;
                            }

                            if(testcase._status === 'failed'){
                                FailedTestsCases++;
                            }
                        }

                        if(
                            testcase &&
                            testcase.iterations &&
                            testcase.iterations.map
                        ) {
                            testcase.iterations.map(function(iteration) {

                                if(
                                    iteration &&
                                    iteration.steps &&
                                    iteration.steps.map
                                ) {
                                    iteration.steps.map(function(step) {
                                        if(step && step._status){
                                            if(step._status === 'passed'){
                                                PassedSteps++;
                                            } else if (step._status === 'failed'){
                                                FailedSteps++;
                                            } else if (step._status === 'warning'){
                                                WarningSteps++;
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        
                    });
                }
            }) 
        }

        if(
            data && 
            data.options
        ) {
            if(data.options.browserName){
                DeviceOrBrowserName = data.options.browserName;
            } else if(data.options.deviceName){
                DeviceOrBrowserName = data.options.deviceName;
            }

            if(data.options.platformName){
                PlatformName = data.options.platformName;

                if(data.options.platformVersion){
                    PlatformName +='&#160;'+data.options.platformVersion;
                }
            }
        }

        
        if(
            data && 
            data.capabilities
        ) {
            if(data.capabilities.browserName){
                DeviceOrBrowserName = data.capabilities.browserName;
            } else if(data.capabilities.deviceName){
                DeviceOrBrowserName = data.capabilities.deviceName;
            }
            
            if(data.capabilities.platformName){
                PlatformName = data.capabilities.platformName;

                if(data.capabilities.platformVersion){
                    PlatformName +='&#160;'+data.capabilities.platformVersion;
                }
            }
        }        

        var CasesPassedRatio = parseInt(PassedTestsCases/(PassedTestsCases+FailedTestsCases).toFixed(1)*100)+'%';
        var CasesFailedRatio = parseInt(FailedTestsCases/(PassedTestsCases+FailedTestsCases).toFixed(1)*100)+'%';

        row1 = `
<div class="row">
    <div class="col-md-12 summary">
        <h1 class="page-header">Tests Summary</h1>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Status</span>
            <div class="value">
                ${ Status }
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Start Date</span>
            <div class="value">${ StartDate }</div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Start / End Time</span>
            <div class="value">
                ${ StartTime }
                -
                ${ EndTime }
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Total Duration</span>
            <div class="value">
            
            ${ Duration } sec
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Total Tests</span>
            <div class="value">
                ${PassedTests+FailedTests}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Passed Tests</span>
            <div class="value passed">
                ${PassedTests}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Failed Tests</span>
            <div class="value failed">
                ${FailedTests}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Iterations</span>
            <div class="value">
                ${Iterations}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Total Steps</span>
            <div class="value">
                ${PassedSteps+FailedSteps+WarningSteps}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Passed Steps</span>
            <div class="value passed">
                ${PassedSteps}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Failed Steps</span>
            <div class="value failed">
                ${FailedSteps}
            </div>
        </div>
        <div class="col-md-3 col-sm-3 col-xs-6 counter">
            <span>Warning Steps</span>
            <div class="value warning">
                ${WarningSteps}
            </div>
        </div>
    </div>
</div>
    `;
    
    
    var row2 = `
<div class="row">
    <div class="col-md-12 summary">
        <h1 class="page-header">Tests / Devices / Browsers</h1>
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>Test Name</th>
                    <th>Device / Browser</th>
                    <th>Platform</th>
                    <th>Pass/Failed Cases</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${Name}</td>
                    <td>
                        ${DeviceOrBrowserName}
                    </td>
                    <td>
                        ${PlatformName}
                    </td>
                    <td>
                        <div class="progress">
                          <div class="progress-bar progress-bar-success" style="width: ${CasesPassedRatio}">
                            <span>${CasesPassedRatio} (${PassedTestsCases})</span>
                          </div>
                          <div class="progress-bar progress-bar-danger" style="width: ${CasesFailedRatio}">
                            <span>${CasesFailedRatio} (${FailedTestsCases})</span>
                          </div>
                        </div>
                    </td>
                    <td>
                        <span class="label ${Status === 'FAILED' ? 'label-danger' : 'label-success' } label-sm">
                            ${Status}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
    `;

    var row3 = `
<div class="row">
    <div class="col-md-12 summary">
        <h1 class="page-header">Detailed Results</h1>
        <h2>
            ${Name} / ${DeviceOrBrowserName}
            <span class="label ${Status === 'FAILED' ? 'label-danger' : 'label-success' } label-sm">
                ${Status}
            </span>
        </h2>
    </div>
</div>
    `;
            } catch(e) {
                console.log('e', e);
            }

    var htmlPath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    fs.writeFileSync(htmlPath, prettifyHtml(htmlStart+row1+row2+row3+iterationsTemplate(data)+close));

    return htmlPath;
};

module.exports = HtmlReporter;
