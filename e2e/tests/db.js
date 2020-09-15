const cmd = require('../tools/cmd');
const { shouldPass, shouldFail } = require('../tools/resultHelper');
const config = require('../tools/config.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

const afterStart = config.afterStart;
const testsFolder = '/db/tests/';
const startPath = afterStart+testsFolder;

const cliProcess = cmd.create(config.start, startPath, '.');

describe('db-module', () => {
    it('[setConnectionString] correct', async () => {
        const response = await cliProcess.execute('db.setConnectionStringPass.js');
        shouldPass(response);
    });

    it('[setConnectionString] not correct', async () => {
        const response = await cliProcess.execute('db.setConnectionStringFail.js');
        shouldFail(response);
    });

    it('[executeQuery] correct', async () => {
        const response = await cliProcess.execute('db.executeQueryPass.js');
        shouldPass(response);
    });

    it('[getScalar] correct', async () => {
        const response = await cliProcess.execute('db.getScalarPass.js');
        shouldPass(response);
    });

    it('[executeNonQuery] correct', async () => {
        const response = await cliProcess.execute('db.executeNonQueryPass.js');
        shouldPass(response);
    });
});