const cmd = require('../tools/cmd');
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/shell/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('shell', () => {
    it('exec correct', async () => {
        const response = await cliProcess.execute('exec.js');
        shouldPass(response);
    });
});