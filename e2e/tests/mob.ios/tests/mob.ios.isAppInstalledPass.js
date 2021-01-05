const caps = require('../assets/caps');

mob.init(caps);
const appId = 'io.appium.TestApp';

const installed = mob.isAppInstalled(appId);
log.info(installed);
assert.equal(installed, true);

mob.closeApp();

mob.pause(2000);

mob.launchApp();

mob.resetApp();

mob.removeApp(appId);

mob.installApp(caps.app);