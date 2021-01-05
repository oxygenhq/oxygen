const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="App"]');

mob.click('//android.widget.TextView[@content-desc="Search"]');

mob.click('//android.widget.TextView[@content-desc="Invoke Search"]');

const input = '/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.LinearLayout[1]/android.widget.LinearLayout/android.widget.EditText';

mob.waitForVisible(input);
mob.waitForExist(input);

var el1 = mob.findElement(input);
mob.click(el1);
mob.transaction('type phone');
mob.type(el1, "0544501591");
mob.sendKeys("Enter");

mob.pause(6000);

mob.hideKeyboard("pressKey", "Search");

mob.clear(el1);

mob.pause(3000);