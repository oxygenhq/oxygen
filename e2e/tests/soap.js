const cmd = require('../tools/cmd');
const { shouldPass } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/soap/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('soap', () => {
    it('[describe] correct', async () => {
        const response = await cliProcess.execute('soap.describePass.js');
        shouldPass(response);
    });

    it('[get] correct', async () => {
        const response = await cliProcess.execute('soap.getPass.js');
        shouldPass(response);
    });
});