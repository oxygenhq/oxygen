const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/email/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('email', () => {
    it('init correct', async () => {
        const response = await cliProcess.execute('1.js');
        shouldPass(response);
    });

    it('getLastEmail not correct', async () => {
        const response = await cliProcess.execute('2.js');
        shouldFail(response);
    });
});