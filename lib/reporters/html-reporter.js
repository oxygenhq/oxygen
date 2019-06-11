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
var EasyXml = require('easyxml');
// var xsltProcessor = require('xslt-processor');
var xsltString = fs.readFileSync('./lib/reporters/html/template.xsl', 'utf8');
var jsPart = fs.readFileSync('./lib/reporters/html/jsPart.html', 'utf8');
var htmlStart = fs.readFileSync('./lib/reporters/html/index.html', 'utf8');
var prettifyHtml = require('prettify-html');
var moment = require('moment');

// const { xsltProcess, xmlParse } = xsltProcessor;

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

                    var template1 = `
<xsl:for-each select="testcases">
    <xsl:if test="not(iterations/steps/failure) and iterations/failure">
        <pre style="background-color: #fcacac">
            <b><xsl:value-of select="iterations/failure/@type"/></b><br/>
            <xsl:value-of select="iterations/failure/@message"/>
            <xsl:if test="iterations/failure/@line"> at line <xsl:value-of select="iterations/failure/@line"/></xsl:if>
        </pre>
    </xsl:if>
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
            <xsl:for-each select="iterations/steps">
                <xsl:if test="not(contains(@name, '.transaction'))">
                    <tr>
                        <xsl:choose>
                            <xsl:when test="contains(@name, 'log.info')">
                                <td></td>
                                <td style="word-wrap: break-word; width: 100%; background-color: #e9f1f9;">
                                <xsl:variable name="cmdArg" select="substring(@name, string-length('log.info(') + 1, string-length(@name) - string-length('log.info(') - 1)"/>
                                <xsl:choose>
                                    <xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
                                        <xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
                                    </xsl:when>
                                    <xsl:otherwise>
                                        <xsl:value-of select="$cmdArg"/>
                                    </xsl:otherwise>
                                </xsl:choose>
                                </td>
                            </xsl:when>
                            <xsl:when test="contains(@name, 'log.warn')">
                                <td></td>
                                <td style="word-wrap: break-word; width: 100%; background-color: #f9f9e9;">
                                    <xsl:variable name="cmdArg" select="substring(@name, string-length('log.warn(') + 1, string-length(@name) - string-length('log.warn(') - 1)"/>
                                    <xsl:choose>
                                        <xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
                                            <xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <xsl:value-of select="$cmdArg"/>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </td>
                            </xsl:when>
                            <xsl:when test="contains(@name, 'log.error')">
                                <td></td>
                                <td style="word-wrap: break-word; width: 100%; background-color: #f9e9ec;">
                                    <xsl:variable name="cmdArg" select="substring(@name, string-length('log.error(') + 1, string-length(@name) - string-length('log.error(') - 1)"/>
                                    <xsl:choose>
                                        <xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
                                            <xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <xsl:value-of select="$cmdArg"/>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </td>
                            </xsl:when>
                            <xsl:when test="contains(@name, 'log.debug')">
                                <td></td>
                                <td style="word-wrap: break-word; width: 100%; background-color: #e9f9ee;">
                                    <xsl:variable name="cmdArg" select="substring(@name, string-length('log.debug(') + 1, string-length(@name) - string-length('log.debug(') - 1)"/>
                                    <xsl:choose>
                                        <xsl:when test="substring($cmdArg, string-length($cmdArg)) = '&quot;'">
                                            <xsl:value-of select="substring($cmdArg, 2, string-length($cmdArg) - 2)"/>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <xsl:value-of select="$cmdArg"/>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </td>
                            </xsl:when>
                            <xsl:otherwise>
                                <td><xsl:number count="steps[not(contains(@name, '.transaction')) and not(contains(@name, 'log.'))]" /></td>
                                <td style="word-wrap: break-word; width: 100%;">
                                    <xsl:value-of select="@name"/>
                                </td>
                                <td><xsl:value-of select="@transaction"/></td>
                                <td><xsl:value-of select="format-number(@duration div 1000, '###,##0.00')"/> s</td>
                                <td>
                                    <xsl:choose>
                                        <xsl:when test="@status='failed'">
                                            <span class="label label-danger label-sm">
                                                <xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
                                            </span>
                                        </xsl:when>
                                        <xsl:when test="@status='warning'">
                                            <span class="label label-warning label-sm">
                                                <xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
                                            </span>
                                        </xsl:when>
                                        <xsl:otherwise>
                                            <span class="label label-success label-sm">
                                                <xsl:value-of select="translate(@status, $smallcase, $uppercase)"/>
                                            </span>
                                        </xsl:otherwise>
                                    </xsl:choose>
                                </td>
                                <td>
                                    <xsl:if test="failure">
                                        <xsl:choose>
                                            <xsl:when test="@screenshotFile">
                                                <a target="_blank"><xsl:attribute name="href">./<xsl:value-of select="@screenshotFile"/></xsl:attribute>
                                                    <b><xsl:value-of select="failure/@type"/></b><br/>
                                                    <xsl:value-of select="failure/@message"/>
                                                    <xsl:if test="failure/data/line">
                                                        at line <xsl:value-of select="failure/data/line"/>
                                                    </xsl:if>
                                                </a>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                <b><xsl:value-of select="failure/@type"/></b><br/>
                                                <xsl:value-of select="failure/@message"/>
                                                <xsl:if test="failure/data/line">
                                                    at line <xsl:value-of select="failure/data/line"/>
                                                </xsl:if>
                                            </xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:if>
                                </td>
                            </xsl:otherwise>
                        </xsl:choose>
                    </tr>
                </xsl:if>
            </xsl:for-each>
            
        </tbody>
    </table>
</xsl:for-each>
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

    var serializer = new EasyXml({
        singularize: true,
        rootElement: 'test-results',
        rootArray: 'test-results',
        dateFormat: 'ISO',
        manifest: true,
        unwrapArrays: true,
        filterNulls: true
    });
    this.replaceScreenshotsWithFiles(resultFolderPath);
    // serialize test results to XML and save to file

    console.log('JSON this.results', JSON.stringify(this.results, null, 2));

    var data = this.results[0];

    var end = '';
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

        var CasesPassedRatio = PassedTests/(PassedTests+FailedTests).toFixed(1)*100+'%';
        var CasesFailedRatio = FailedTests/(PassedTests+FailedTests).toFixed(1)*100+'%';

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
            <xsl:value-of select="format-number(sum(./test-result/summary/@duration) div 1000, '###,##0.0')"/> 
            
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
                            <span>${CasesPassedRatio} (${PassedTests})</span>
                          </div>
                          <!--<div class="progress-bar progress-bar-warning" style="width: 5%">
                            <span class="sr-only">20% Complete (warning)</span>
                          </div>-->
                          <div class="progress-bar progress-bar-danger" style="width: ${CasesFailedRatio}">
                            <span>${CasesFailedRatio} (${FailedTests})</span>
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
        <xsl:for-each select="./test-result">
            <h2>
                ${Name} / ${DeviceOrBrowserName}
                <span class="label ${Status === 'FAILED' ? 'label-danger' : 'label-success' } label-sm">
                    ${Status}
                </span>
            </h2>
            <xsl:for-each select="./iterations">
                <xsl:variable name="globalIndex">
                    <xsl:number level="any" />
                </xsl:variable>
                <xsl:apply-templates select=".">
                    <xsl:with-param name="globalIndex" select="$globalIndex" />
                </xsl:apply-templates>
            </xsl:for-each>
        </xsl:for-each>
    </div>
</div>
    `;
            } catch(e) {
                console.log('e', e);
            }

    var htmlPath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    fs.writeFileSync(htmlPath, prettifyHtml(htmlStart+row1+row2+row3+iterationsTemplate(data)+close));



    // var xml = serializer.render(this.results);
    // fs.writeFileSync(resultFilePath, xml);
    
    // htmlPath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');

    // runXslTransform(resultFilePath, xml, htmlPath);
    // // replace .xml file extension with .html
    // resultFilePath = resultFilePath.replace(new RegExp('.xml', 'g'), '.htm');
    return htmlPath;
};

function runXslTransform(xmlFile, xmlString, htmlPath) {

    try {
        // outXmlString: output xml string.
        // const outXmlString = xsltProcess(
        //     xmlParse(xmlString),
        //     xmlParse(xsltString)
        // );
        

        // console.log('xsltString', xsltString);
        // console.log('xmlString', xmlString);
        // console.log('outXmlString', outXmlString);
        //console.log('htmlPath', htmlPath);

        if(outXmlString){
            fs.writeFileSync(htmlPath, outXmlString+jsPart);
        }

    } catch(e){
        console.log('e',e);
    }

    // var exec = require('child_process').execFileSync;
    // var transPath = path.join(__dirname, 'html', 'XSLTransform.exe');

    
    // if (/^win/.test(process.platform)) {
    //     exec(transPath, [xmlFile], {stdio:[0,1,2]});
    // } else {
    //     try {
    //         exec('mono', [transPath, xmlFile], {stdio:[0,1,2]});
    //     }
    //     catch (e) {
    //         // assume the error occurs because Mono is not installed
    //         throw new Error('Mono installation is missing or no sufficient privileges.');
    //     }
    // }
    
    // fs.unlinkSync(xmlFile);
}

module.exports = HtmlReporter;
