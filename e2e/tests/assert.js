const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/assert/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('assert-module', () => {
    it('assert correct', async () => {
        const response = await cliProcess.execute('assert.assertPass.js');
        shouldPass(response);
    });

    it('assert not correct', async () => {
        const response = await cliProcess.execute('assert.assertFail.js');
        shouldFail(response);
    });

    it('assertNot correct', async () => {
        const response = await cliProcess.execute('assert.assertNotPass.js');
        shouldPass(response);
    });

    it('assertNot not correct', async () => {
        const response = await cliProcess.execute('assert.assertNotFail.js');
        shouldFail(response);
    });

    it('fail correct', async () => {
        const response = await cliProcess.execute('assert.failFail.js');
        shouldFail(response);
    });

    it('fail correct 2', async () => {
        const response = await cliProcess.execute('assert.failPass.js');
        shouldPass(response);
    });
});