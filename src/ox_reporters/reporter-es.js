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
import moment from 'moment';
import RealTimeReporterBase from '../reporter/RealTimeReporterBase';

const ES_STEP_ENTRY = {
    step_type: 'step',
    sub_steps_count: 0,
    start_time: null,
    duration: null,
    location: null,
    active_users: null,
    step_name: null,
    transaction_name: null,
    case_name: null,
    suite_name: null,
    iteration_num: null,
    status: null,
    failure: null,
};

const ES_FAILURE_TYPE = {

}

export default class ElasticSearchReporter extends RealTimeReporterBase {
    constructor(options) {
        super(options);
        this.esClient = null;
        this.lastTransactionByRunner = {};
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

    async onStepEnd(rid, stepEvent, totalRunners) {
        const esStepEntry = this._generateStepEntry(rid, stepEvent, totalRunners);
        const endedTransactionEntry = this._handleTransactionStep(esStepEntry);
        //const esTransactionEntry = this._generateTransactionEntry(rid, stepEvent, totalRunners);
        try {            
            if (endedTransactionEntry) {
                await this.esClient.index({
                    index: 'cbrt-steps',
                    body: endedTransactionEntry
                });
            }
            await this.esClient.index({
                index: 'cbrt-steps',
                body: esStepEntry
            });
        }
        catch (e) {
            console.error('Failed to index step:', e);
        }
    }

    _handleTransactionStep(esStepEntry) {
        const lastTransEntry = this.lastTransactionByRunner[esStepEntry.rid] || null;
        // case we are seeing transaction method for the first time in the script
        if (!lastTransEntry && esStepEntry.transaction_name && esStepEntry.step_name.indexOf('transaction(') > -1) {
            this.lastTransactionByRunner[esStepEntry.rid] = { ...esStepEntry, step_name: esStepEntry.transaction_name, step_type: 'transaction' };
        }
        // case we are still getting current transaction related steps
        else if (lastTransEntry && esStepEntry.transaction_name === lastTransEntry.transaction_name) {
            lastTransEntry.sub_steps_count ++;
            if (esStepEntry.step_name.indexOf('web.pause') == 0 ||
                esStepEntry.step_name.indexOf('mob.pause') == 0
            ) {
                return null; // do not include "pause" steps in the transaction duration
            }
            lastTransEntry.duration += esStepEntry.duration;
            if (esStepEntry.failure) {
                lastTransEntry.status = 'failed';
                lastTransEntry.failure_rate = 1;
                lastTransEntry.failure = esStepEntry.failure;
            }
        }
        else if (lastTransEntry && esStepEntry.transaction_name !== lastTransEntry.transaction_name) {
            this.lastTransactionByRunner[esStepEntry.rid] = { ...esStepEntry, step_name: esStepEntry.transaction_name, step_type: 'transaction' };            
            return lastTransEntry;  // return the previous transaction so it will to be added to ES
        }
        return null;
    }

    _generateStepEntry(rid ,stepEvent, totalRunners) {
        const stepResult = stepEvent.result;
        const entry = { ...ES_STEP_ENTRY };
        entry.rid = rid;
        entry.case_name = stepEvent.ctx.test.case.name;
        entry.iteration_num = stepEvent.ctx.test.case.iteration;
        entry.suite_name = stepEvent.ctx.test.suite.name;
        entry.start_time = moment(stepResult.startTime).format('yyyy-MM-DDTHH:mm:ss');
        entry.duration = stepResult.duration / 1000;
        entry.step_name = stepResult.name;
        entry.location = stepResult.location;
        entry.transaction_name = stepResult.transaction;
        entry.status = stepResult.status;
        entry.failure_rate = stepResult.status === 'failed' ? 1 : 0;
        entry.screenshot = stepResult.screenshot;
        entry.active_users = totalRunners;
        if (stepResult.failure) {
            entry.failure = {
                ...stepResult.failure
            };
        }
        return entry;
    }

}
