const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="Views"]');

mob.click('//android.widget.TextView[@content-desc="Controls"]');

mob.click('//android.widget.TextView[@content-desc="2. Dark Theme"]');
mob.hideKeyboard("pressKey", "Done");

let checked = mob.isChecked('//android.widget.CheckBox[@content-desc="Checkbox 1"]');
log.info(checked);
assert.equal(checked, false);

const loc1 = mob.getLocation('//android.widget.CheckBox[@content-desc="Checkbox 1"]');
mob.tap(loc1.x,loc1.y);

mob.pause(15000);

checked = mob.isChecked('//android.widget.CheckBox[@content-desc="Checkbox 1"]');
log.info(checked);
assert.equal(checked, true);