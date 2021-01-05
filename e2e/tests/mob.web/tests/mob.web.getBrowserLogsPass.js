const caps = require('../assets/caps');
mob.init(caps);
mob.setTimeout(6000);
mob.open("https://www.wikipedia.org/");
mob.open("https://en.wikipedia.org/wiki/Main_Page");
const logs = mob.getBrowserLogs();
log.info(logs.length);
const logsCorrect = logs && Array.isArray(logs) && logs.length > 0;
assert.equal(logsCorrect, true);