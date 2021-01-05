const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/pdf/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('pdf', () => {
    it('assert correct page', async () => {
        const response = await cliProcess.execute('1.js');
        shouldPass(response);
    });

    it('assert incorect page fail', async () => {
        const response = await cliProcess.execute('2.js');
        shouldFail(response);
    });

    it('assert wrong pdf path fail', async () => {
        const response = await cliProcess.execute('3.js');
        shouldFail(response);
    });

    it('assertNot correct page', async () => {
        const response = await cliProcess.execute('4.js');
        shouldFail(response);
    });

    it('assertNot incorect page fail', async () => {
        const response = await cliProcess.execute('5.js');
        shouldPass(response);
    });

    it('assertNot wrong pdf path fail', async () => {
        const response = await cliProcess.execute('6.js');
        shouldFail(response);
    });

    it('count valid', async () => {
        const response = await cliProcess.execute('7.js');
        shouldPass(response);
    });

    it('count not valid', async () => {
        const response = await cliProcess.execute('8.js');
        shouldFail(response);
    });
});
