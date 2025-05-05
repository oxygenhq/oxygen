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
    STEP: 'STEP',
};
const MAX_NAME_LENGTH = 128;

export default class ReportPortalReporter extends ReporterBase {
    constructor(options, reporterOpts, aggregator) {
        super(options);
        this.reporterOpts = reporterOpts || options.rp;
        this.reportSteps = reporterOpts.reportSteps || true;
        this.reportLogs = reporterOpts.reportLogs || false;
        this.cbSuiteToRpIdHash = {};
        this.cbCaseToRpIdHash = {};
        this.cbStepToRpIdHash = {};
        this.currentTransactionStepId = undefined;
        this.currentSubStepId = undefined;
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
            await this.promiseWithTimeout(promise);
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
            await this.promiseWithTimeout(promise);
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
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to finish suite item: ${e}`);
        }
    }
    async onCaseStart({ rid, suiteId, caseId, 'case': caseDef }) {
        const startTestItemReq = {
            name: caseDef.name,
            type: TEST_ITEM_TYPES.TEST,
            codeRef: caseDef.path,
        };
        const rpSuiteId = this.cbSuiteToRpIdHash[suiteId];
        if (!rpSuiteId) {
            return;
        }
        const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId, rpSuiteId);
        this.cbCaseToRpIdHash[caseId] = tempId;
        try {
            await this.promiseWithTimeout(promise);
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
        const status = result.status.toLowerCase();
        if (status === 'failed' && result.failure) {
            const rpFile = result.screenshot ?
            {
                name: 'screenshot',
                type: 'image/png',
                content: result.screenshot,
            } : undefined;
            const logReq = {
                message: result.failure.message,
                level: 'error'
            };
            const { promise } = this.rpClient.sendLog(rpTestId, logReq, rpFile);

            try {
                await this.promiseWithTimeout(promise);
            } catch (e) {
                console.dir(`RP - Failed to send log for finished test item: ${e}`);
            }
        }
        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };
        const { promise } = this.rpClient.finishTestItem(rpTestId, finishTestItemReq);
        try {
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to finish test item: ${e}`);
        }
    }
    async onStepStart({ rid, caseId, step }) {
        if (!this.reportSteps) {
            return;
        }
        if (step.module && step.module === 'log') {
            await this.reportLogStep(caseId, step);
            return;
        }
        const rpCaseId = this.cbCaseToRpIdHash[caseId];
        let rpParentId; /* = this.currentTransactionStepId ?
            this.cbStepToRpIdHash[this.currentTransactionStepId]
            : this.cbStepToRpIdHash[caseId];*/
        // const rpCaseId = this.cbCaseToRpIdHash[caseId];
        if (step.name === 'transaction') {
            this.currentTransactionStepId = step.id;
            rpParentId = this.cbCaseToRpIdHash[caseId];
        }
        else {
            this.currentSubStepId = step.id;
            rpParentId = this.currentTransactionStepId ?
                this.cbStepToRpIdHash[this.currentTransactionStepId]: this.cbStepToRpIdHash[caseId];
        }
        if (!rpParentId || !rpCaseId) {
            return;
        }
        const stepName = this._getStepName(step);
        const startTestItemReq = {
            name: stepName,
            type: TEST_ITEM_TYPES.STEP,
            // "codeRef" + "parameters" used by RP lib to generate testCaseId if testCaseId is not defined
            // see https://github.com/reportportal/client-javascript/blob/486ef70c638a9a23267290c62df1faf900f7df6a/lib/report-portal-client.js#L497
            // this is disabled for now. not sure if actually needed...
            //parameters: this._getRpArgs(step.args),
            codeRef: step.location,
            testCaseId: rpCaseId,
            hasStats: false,
        };
        const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId, rpParentId);
        this.cbStepToRpIdHash[step.id] = tempId;
        try {
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to start step item: ${e}`);
        }
    }
    async onStepEnd({ rid, step: result }) {
        if (!this.reportSteps) {
            return;
        }
        if (result.module && result.module === 'log') {
            return;
        }
        const rpStepId = this.cbStepToRpIdHash[result.id];
        if (!rpStepId) {
            return;
        }
        if (result.name !== 'transaction') {
            this.currentSubStepId = undefined;
        }
        const status = result.status.toLowerCase();
        if (status === 'failed' && result.failure) {
            const rpFile = result.screenshot ?
            {
                name: 'screenshot',
                type: 'image/png',
                content: result.screenshot,
            } : undefined;
            const logReq = {
                message: result.failure.message,
                level: 'error',
                file: rpFile,
            };
            const { promise } = this.rpClient.sendLog(rpStepId, logReq, rpFile);

            try {
                await this.promiseWithTimeout(promise);
            } catch (e) {
                console.dir(`RP - Failed to send log for finished test item: ${e}`);
            }
        }
        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };
        const { promise } = this.rpClient.finishTestItem(rpStepId, finishTestItemReq);
        try {
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to finish step item: ${e}`);
        }
    }
    async onLog({ suiteId, caseId, stepId, level, msg, time, src }) {
        if (!this.reportLogs) {
            return;
        }
        // Oxygen might start generating logs before onRunnerStart event, ignore them
        if (!this.tempLaunchId) {
            return;
        }
        const rpParentId = stepId ?
            this.cbStepToRpIdHash[stepId]
            : caseId ? this.cbCaseToRpIdHash[caseId]
            : suiteId ? this.cbSuiteToRpIdHash[suiteId]
            : undefined;
        const rpLevel = this._getRpLevel(level);
        const logReq = {
            message: msg,
            level: rpLevel,
            time: time,
        };
        const { promise } = this.rpClient.sendLog(rpParentId || this.tempLaunchId, logReq);
        try {
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to create log item: ${e}`);
        }
    }
    async reportLogStep(caseId, step) {
        if (!step.args || !step.args.length) {
            return;
        }
        const level = step.name;
        const msg = step.args[0];
        const time = step.time;
        let stepId = undefined;
        if (this.currentSubStepId) {
            stepId = this.currentSubStepId;
        }
        else if (this.currentTransactionStepId) {
            stepId = this.currentTransactionStepId;
        }
        await this.sendRpLog({ suiteId: undefined, caseId, stepId, level, msg, time });
    }
    async sendRpLog({ suiteId, caseId, stepId, level, msg, time }) {
        // Oxygen might start generating logs before onRunnerStart event, ignore them
        if (!this.tempLaunchId) {
            return;
        }
        const rpParentId = stepId ?
            this.cbStepToRpIdHash[stepId]
            : caseId ? this.cbCaseToRpIdHash[caseId]
            : suiteId ? this.cbSuiteToRpIdHash[suiteId]
            : undefined;
        const rpLevel = this._getRpLevel(level);
        const logReq = {
            message: msg,
            level: rpLevel,
            time: time,
        };
        const { promise } = this.rpClient.sendLog(rpParentId || this.tempLaunchId, logReq);
        try {
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to create log item: ${e}`);
        }
    }
    _getRpLevel(oxLevel) {
        if (oxLevel) {
            return oxLevel.toLowerCase();
        }
        return 'info';
    }
    /*_getRpArgs(cbArgs) {
        if (!cbArgs || !cbArgs.length) {
            return undefined;
        }
        const rpArgs = [];
        for (let i=0; i < cbArgs.length; i++) {
            const arg = cbArgs[i];
            let argStr = typeof arg === 'string' || arg instanceof String ? arg : JSON.stringify(arg);
            rpArgs.push({
                key: `arg${i}`,
                value: argStr
            });
        }
        return rpArgs;
    }*/
    _getStepName(step) {
        let name;

        if (step.name === 'transaction' && step.args.length > 0) {  // FIXME: steps need to be nested under transactions
            name = step.args[0];
        }
        else if (step.signature) {
            name = step.signature;
        }
        else if (step.module) {                         // FIXME: is this ever reached? "step.signature" seems to always exist
            name = `${step.module}.${step.name}`;
        }
        else {
            name = step.name;
        }

        // maximum allowed name length in RP is 1024 bytes
        // we truncate it even lower so it will display nicely
        if (name.length > MAX_NAME_LENGTH) {
            name = name.substring(0, MAX_NAME_LENGTH-3) + '...';
        }
        return name;
    }
    promiseWithTimeout(promise, timeout = 10 * 10000) {
        return new Promise((resolve, reject) => {
            if (!promise || !promise.then) {
                reject(new Error(`Promise await timeout of ${timeout} ms`));
            }
            promise.then(resolve, reject);
            setTimeout(reject, timeout);
        });
    }
}

