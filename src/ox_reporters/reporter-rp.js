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
import Status from '../model/status';
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
        this.cbSuiteResultListByRefId = {};
        this.cbCaseToCurrentTransactionId = {};
        this.cbCaseToCurrentSubStepId = {};
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
    async onLaunchStart({ options }) {
        try {
            const { tempId, promise } = this.rpClient.startLaunch({
                mode: this.reporterOpts.mode || LAUNCH_MODES.DEFAULT,
                debug: false,
            });
            this.tempLaunchId = tempId;

            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to start launch: ${e}`);
        }
    }
    async onLaunchEnd({ results }) {
        // report the end of all started suites
        await this._reportEndOfStartedSuites();
        // Calculate launch status
        const hasFailed = results.some(x => x.status === Status.FAILED);

        try {
            const { promise } = await this.rpClient.finishLaunch(this.tempLaunchId, {
                status: hasFailed ? 'FAILED' : 'PASSED'
            });
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to end launch: ${e}`);
        }
    }
    async onRunnerStart({ rid, opts, caps }) {
    }
    async onRunnerEnd({ rid, result }) {
    }
    async onSuiteStart({ rid, suiteId, suite: suiteDef }) {
        // in parallel test execution, onSuiteStart will be called multiple times for the same suite 
        // make sure we call "startTestItem" the same suite only once
        const suiteRefId = suiteDef.refId;
        if (this.cbSuiteToRpIdHash[suiteRefId]) {
            return;
        }
        // assign empty object as a form of multi-thread lock,
        // so the parallel call to onSuiteStart from the next thread
        // will not try to proceed with the code below
        this.cbSuiteToRpIdHash[suiteRefId] = {};
        this.cbSuiteResultListByRefId[suiteRefId] = [];
        const startTestItemReq = {
            name: suiteDef.name || this.options.name,
            type: TEST_ITEM_TYPES.SUITE,
        };

        try {
            const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId);
            this.cbSuiteToRpIdHash[suiteRefId] = tempId;
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to start suite item: ${e}`);
        }
    }
    async onSuiteEnd({ rid, suiteId, result }) {
        const suiteRefId = result.refId;
        this.cbSuiteResultListByRefId[suiteRefId] && this.cbSuiteResultListByRefId[suiteRefId].push(result);
    }
    async onCaseStart({ rid, suiteId, suiteRefId, caseId, 'case': caseDef }) {
        const startTestItemReq = {
            name: caseDef.name,
            type: TEST_ITEM_TYPES.TEST,
            codeRef: caseDef.path,
        };
        const rpSuiteId = this.cbSuiteToRpIdHash[suiteRefId];
        if (!rpSuiteId) {
            return;
        }

        try {
            const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId, rpSuiteId);
            this.cbCaseToRpIdHash[caseId] = tempId;
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to start case item: ${e}`);
        }
    }
    async onCaseEnd({ rid, suiteId, suiteRefId, caseId, result }) {
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

            const logMsg = this._stringify(result.failure.message);
            if (logMsg) {
                const logReq = {
                    message: logMsg,
                    level: 'error'
                };

                try {
                    const { promise } = this.rpClient.sendLog(rpTestId, logReq, rpFile);
                    await this.promiseWithTimeout(promise);
                } catch (e) {
                    console.dir(`RP - Failed to send log for finished case item: ${e}`);
                }
            }
        }

        const transId = this.cbCaseToCurrentTransactionId[caseId];

        if (transId) {
            // FIXME: should calculate proper status
            const finishTransactionReq = {
                status: 'passed' //result.status.toLowerCase(),
            };

            try {
                const transRpId = this.cbStepToRpIdHash[transId];

                const { promise } = this.rpClient.finishTestItem(transRpId, finishTransactionReq);
                await this.promiseWithTimeout(promise);
            }
            catch (e) {
                console.dir(`RP - Failed to finish transaction item on case end: ${e}`);
            }

            delete this.cbCaseToCurrentTransactionId[caseId];
        }

        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };

        try {
            const { promise } = this.rpClient.finishTestItem(rpTestId, finishTestItemReq);
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to finish case item: ${e}`);
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
        let rpParentId;

        const transId = this.cbCaseToCurrentTransactionId[caseId];

        if (step.name === 'transaction') {
            if (transId) {
                // FIXME: should calculate proper status
                const finishTransactionReq = {
                    status: 'passed' //result.status.toLowerCase(),
                };

                try {
                    const transRpId = this.cbStepToRpIdHash[transId];
                    const { promise } = this.rpClient.finishTestItem(transRpId, finishTransactionReq);
                    await this.promiseWithTimeout(promise);
                }
                catch (e) {
                    console.dir(`RP - Failed to finish transaction item on case end: ${e}`);
                }
            }

            this.cbCaseToCurrentTransactionId[caseId] = step.id;
            delete this.cbCaseToCurrentSubStepId[caseId];
            rpParentId = rpCaseId;
        }
        else {
            this.cbCaseToCurrentSubStepId[caseId] = step.id;
            rpParentId = transId ? this.cbStepToRpIdHash[transId] : rpCaseId;
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

        try {
            const { tempId, promise } = this.rpClient.startTestItem(startTestItemReq, this.tempLaunchId, rpParentId);
            this.cbStepToRpIdHash[step.id] = tempId;
            await this.promiseWithTimeout(promise);
        }
        catch (e) {
            console.dir(`RP - Failed to start step item: ${e}`);
        }
    }
    async onStepEnd({ rid, caseId, step: result }) {
        if (!this.reportSteps) {
            return;
        }
        if (result.name && (result.name.startsWith('log.') ||
                            result.name.startsWith('web.transaction') ||
                            result.name.startsWith('mob.transaction'))) {
            return;
        }
        const rpStepId = this.cbStepToRpIdHash[result.id];
        if (!rpStepId) {
            return;
        }

        delete this.cbCaseToCurrentSubStepId[caseId];

        const status = result.status.toLowerCase();
        if (status === 'failed' && result.failure) {
            const rpFile = result.screenshot ?
            {
                name: 'screenshot',
                type: 'image/png',
                content: result.screenshot,
            } : undefined;

            const logMsg = this._stringify(result.failure.message);
            if (logMsg) {
                const logReq = {
                    message: logMsg,
                    level: 'error',
                    file: rpFile,
                };

                try {
                    const { promise } = this.rpClient.sendLog(rpStepId, logReq, rpFile);
                    await this.promiseWithTimeout(promise);
                } catch (e) {
                    console.dir(`RP - Failed to send log for finished step item: ${e}`);
                }
            }
        }
        const finishTestItemReq = {
            status: result.status.toLowerCase(),
        };

        try {
            const { promise } = this.rpClient.finishTestItem(rpStepId, finishTestItemReq);
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

        const logMsg = this._stringify(msg);
        if (logMsg) {
            const logReq = {
                message: logMsg,
                level: rpLevel,
                time: time,
            };

            try {
                const { promise } = this.rpClient.sendLog(rpParentId || this.tempLaunchId, logReq);
                await this.promiseWithTimeout(promise);
            }
            catch (e) {
                console.dir(`RP - Failed to create log item: ${e}`);
            }
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
        if (this.cbCaseToCurrentSubStepId[caseId]) {
            stepId = this.cbCaseToCurrentSubStepId[caseId];
        } else if (this.cbCaseToCurrentTransactionId[caseId]) {
            stepId = this.cbCaseToCurrentTransactionId[caseId];
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

        const logMsg = this._stringify(msg);
        if (logMsg) {
            const logReq = {
                message: logMsg,
                level: rpLevel,
                time: time,
            };

            try {
                const { promise } = this.rpClient.sendLog(rpParentId || this.tempLaunchId, logReq);
                await this.promiseWithTimeout(promise);
            }
            catch (e) {
                console.dir(`RP - Failed to create log item: ${e}`);
            }
        }
    }
    async _reportEndOfStartedSuites() {
        for (const suiteRefId of Object.keys(this.cbSuiteToRpIdHash)) {
            const rpSuiteId = this.cbSuiteToRpIdHash[suiteRefId];
            const results = this.cbSuiteResultListByRefId[suiteRefId];
            delete this.cbSuiteToRpIdHash[suiteRefId];
            const hasFailedSuite = results.some(x => x.status === Status.FAILED);
            const finishTestItemReq = {
                status: hasFailedSuite ? 'failed' : 'passed',
            };

            try {
                const { promise } = this.rpClient.finishTestItem(rpSuiteId, finishTestItemReq);
                await this.promiseWithTimeout(promise);
            }
            catch (e) {
                console.dir(`RP - Failed to finish suite item: ${e}`);
            }
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

    // returns null if msg cannot be stringified, or strigifies it if it's not a string already
    _stringify(msg) {
        // we test for undefined and null explicitly on purpose because other falsy values (e.g. 0) are ok
        if (typeof msg === 'undefined' || msg === null) {
            return null;
        }

        if (typeof msg === 'string' || msg instanceof String) {
            return msg;
        }

        try {
            return JSON.stringify(msg);
        } catch (e) {
            console.error('RP - error sending log: msg object cannot be serialized');
        }
    }

    promiseWithTimeout(promise, timeout = 30 * 1000) {
        return new Promise((resolve, reject) => {
            if (!promise || !promise.then) {
                reject(new Error(`Promise await timeout of ${timeout} ms`));
            }
            promise.then(resolve, reject);
            setTimeout(reject, timeout);
        });
    }
}

