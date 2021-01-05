const cmd = require('../tools/cmd');
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/serial/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('serial', () => {
    it('list correct', async () => {
        const response = await cliProcess.execute('list.js');
        shouldPass(response);
    });
    it('open correct', async () => {
        const response = await cliProcess.execute('open.js');
        shouldPass(response);
    });
    it('waitForText correct', async () => {
        const response = await cliProcess.execute('waitForText.js');
        shouldPass(response);
    });
    it('write correct', async () => {
        const response = await cliProcess.execute('write.js');
        shouldPass(response);
    });
});
