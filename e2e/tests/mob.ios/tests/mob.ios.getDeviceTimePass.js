const caps = require('../assets/caps');
mob.init(caps);

const time = mob.getDeviceTime();
log.info(time);

const timeCorrect = time && typeof time === 'string' && time.length > 0;
assert.equal(timeCorrect, true);