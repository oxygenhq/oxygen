const path = require('path');
const config = require('./config.json');

let start = config.start;

if (process.platform === 'darwin') {
    start = config.startDarwin;
}

start = path.resolve(__dirname, '../../'+start);

module.exports = {
    start: start,
    afterStart: 'e2e/tests'
};