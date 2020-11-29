/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Elastic Search Reporter
 */
import { Client } from '@elastic/elasticsearch';
import RealTimeReporterBase from '../reporter/RealTimeReporterBase';

export default class ElasticSearchReporter extends RealTimeReporterBase {
    constructor(options) {
        super(options);
        this.esClient = null;
        this.initESClient();
    }

    initESClient() {
        const esOpts = {
            node: 'http://localhost:9200'
        };
        if (this.options.elasticOpts) {
            const esUserOpts = this.options.elasticOpts;
            if (esUserOpts.node) {
                esOpts.node = esUserOpts.node;
            }
            if (esUserOpts.username && esUserOpts.password) {
                esOpts.auth = {
                    username: esUserOpts.username,
                    password: esUserOpts.password
                };
            }
            
        }   
        this.esClient = new Client(esOpts);
    }

    onRunnerStart(sid, opts, caps, testResult, totalRunners) {
        //console.log('ElasticSearchReporter - onRunnerStart')
    }

    onRunnerEnd(sid, testResult, totalRunners) {
        //console.log('ElasticSearchReporter - onRunnerEnd')
    }

    onIterationStart(rid, iteration, start) {
        //console.log('ElasticSearchReporter - onIterationStart')
    }

    onIterationEnd(rid, result, start) {
        //console.log('ElasticSearchReporter - onIterationEnd')
    }

    onSuiteStart(rid, suiteDef) {
        //console.log('ElasticSearchReporter - onSuiteStart')
    }

    onSuiteEnd(rid, suiteId, suiteResult, totalRunners) {
        console.log('ElasticSearchReporter - onSuiteEnd')
    }

    onCaseStart(rid, suiteId, caseId, caseDef) {
        //console.log('ElasticSearchReporter - onCaseStart')
    }

    onCaseEnd(rid, suiteId, caseId, caseResult) {
        //console.log('ElasticSearchReporter - onCaseEnd')
    }

    onStepStart(rid, stepDef) {

    }

    onStepEnd(rid, stepResult, totalRunners) {
        this.esClient.index({
            index: 'cbrt-steps',
            body: stepResult
        });
    }

}
