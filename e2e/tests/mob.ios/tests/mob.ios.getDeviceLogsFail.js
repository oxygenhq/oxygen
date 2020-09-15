const caps = require('../assets/caps');

mob.init(caps);

const logs = mob.getDeviceLogs();
log.info(logs);
const logsCorrect = logs && Array.isArray(logs);
assert.equal(logsCorrect, true);