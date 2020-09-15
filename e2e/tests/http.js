const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/http/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('http', () => {
    it('get correct', async () => {
        const response = await cliProcess.execute('1.js');
        shouldPass(response);
    });

    it('post correct', async () => {
        const response = await cliProcess.execute('2.js');
        shouldPass(response);
    });
    it('put not correct', async () => {
        const response = await cliProcess.execute('3.js');
        shouldFail(response);
    });
    it('delete correct', async () => {
        const response = await cliProcess.execute('4.js');
        shouldFail(response);
    });
    it('getResponseHeaders correct', async () => {
        const response = await cliProcess.execute('5.js');
        shouldPass(response);
    });
});
