const cmd = require('../tools/cmd');
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/log/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('log', () => {
    it('info correct', async () => {
        const response = await cliProcess.execute('1.js');
        shouldPass(response);
    });
    it('error correct', async () => {
        const response = await cliProcess.execute('2.js');
        shouldPass(response);
    });
    it('debug correct', async () => {
        const response = await cliProcess.execute('3.js');
        shouldPass(response);
    });
    it('warn correct', async () => {
        const response = await cliProcess.execute('4.js');
        shouldPass(response);
    });
});
