const cmd = require('../tools/cmd');
const assert = require('chai').assert;
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const before = mocha.before;

const afterStart = config.afterStart;
const testsFolder = '/twilio/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('twilio', () => {
    before(() => {
        assert.equal(!!process.env.accountSid, true, 'Please set "accountSid" env');
        assert.equal(!!process.env.authToken, true, 'Please set "authToken" env');
    });

    it('[init] correct', async () => {
        const response = await cliProcess.execute('twilio.initPass.js');
        shouldPass(response);
    });
});