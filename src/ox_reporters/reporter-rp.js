/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen Reporter for ReportPortal
 */
import ReporterBase from '../reporter/ReporterBase';
const RPClient = require('@oxygenhq/rp-client-javascript');
const LAUNCH_MODES = {
    DEFAULT: 'DEFAULT',
    DEBUG: 'DEBUG',
};
const TEST_ITEM_TYPES = {
    SUITE: 'SUITE',
    TEST: 'TEST',
    STEP: 'STEP'
};

export default class ReportPortalReporter extends ReporterBase {
    constructor(options, reporterOpts, aggregator) {
        super(options);
        this.reporterOpts = reporterOpts || options.rp;
        this.cbSuiteToRpIdHash = {};
        this.cbCaseToRpIdHash = {};
        if (
            !this.reporterOpts
            || !this.reporterOpts.apiKey
            || !this.reporterOpts.endpoint
            || !this.reporterOpts.project
        ) {
            throw new Error('ReportPortal options are missing in oxygen.conf file.');
        }
        this.aggregator = aggregator;
        this.rpClient = new RPClient({
            launch: this.reporterOpts.launch || this.options.name,
            ...this.reporterOpts
        });
    }

    async init() {
        try {
            await this.rpClient.checkConnect();
        }
        catch (e) {
            throw new Error(`RP - Error connecting to the server: ${e.message}`);
        }
    }
    async generate(results) {
    }
    // Events
    async onRunnerStart({ rid, opts, caps }) {
        const { tempId, promise } = this.rpClient.startLaunch({
            mode: this.reporterOpts.mode || LAUNCH_MODES.DEFAULT,
            debug: false,
        });
        this.tempLaunchId = tempId;
        promise.then((response) => {
        }, (error) => {
            console.dir(`RP - Error at the start of launch: ${error}`);
        });
    }
    async onRunnerEnd({ rid, result }) {
        // await this.rpClient.getPromiseFinishAllItems(this.tempLaunchId);
        const { promise } = await this.rpClient.finishLaunch(this.tempLaunchId, {
            status: result.status.toLowerCase(),
        });
        try {
            await promise;
        }
        catch (e) {
            console.dir(`RP - Failed to end launch: ${e}`);
        }
    }
    async onSuiteStart({ rid, suiteId, suite: suiteDef }) {
        const startTestItemReq = {
            name: suiteDef.name || this.options.name,
            type: TEST_ITEM_TYPES.SUITE,
        };
        const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId);
        this.cbSuiteToRpIdHash[suiteId] = tempId;
        try {
            await promise;
        }
        catch (e) {
            console.dir(`RP - Failed to start suite item: ${e}`);
        }
    }
    async onSuiteEnd({ rid, suiteId, result }) {
        if (!this.cbSuiteToRpIdHash[suiteId]) {
            return;
        }
        const rpSuiteId = this.cbSuiteToRpIdHash[suiteId];
        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };
        const { promise } = this.rpClient.finishTestItem(rpSuiteId, finishTestItemReq);
        try {
            await promise;
        }
        catch (e) {
            console.dir(`RP - Failed to finish suite item: ${e}`);
        }
    }
    async onCaseStart({ rid, suiteId, caseId, 'case': caseDef }) {
        const startTestItemReq = {
            name: caseDef.name,
            type: TEST_ITEM_TYPES.TEST,
        };
        const rpSuiteId = this.cbSuiteToRpIdHash[suiteId];
        if (!rpSuiteId) {
            return;
        }
        const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId, rpSuiteId);
        this.cbCaseToRpIdHash[caseId] = tempId;
        try {
            await promise;
        }
        catch (e) {
            console.dir(`RP - Failed to start test item: ${e}`);
        }
    }
    async onCaseEnd({ rid, suiteId, caseId, result }) {
        const rpTestId = this.cbCaseToRpIdHash[caseId];
        if (!rpTestId) {
            return;
        }
        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };
        const { promise } = this.rpClient.finishTestItem(rpTestId, finishTestItemReq);
        try {
            await promise;
        }
        catch (e) {
            console.dir(`RP - Failed to finish test item: ${e}`);
        }
    }
    async onStepStart({ rid, step }) {
        // TODO: implement this method
    }
    async onStepEnd({ rid, result }) {
        // TODO: implement this method
    }
}

