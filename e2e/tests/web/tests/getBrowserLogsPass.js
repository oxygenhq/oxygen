web.init();
web.setTimeout(6000);
web.open('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml_link_target');

const logs = web.getBrowserLogs();
const logsCorrect = logs && Array.isArray(logs) && logs.length > 0;
assert.equal(logsCorrect, true);
