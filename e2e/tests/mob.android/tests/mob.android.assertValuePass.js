// const caps = require('../assets/caps');
// const path = require('path');
// const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
// caps.app = apkPath;
// mob.init(caps);

// mob.click('//android.widget.TextView[@content-desc="Views"]');

// mob.pause(5000);

// mob.click('//android.widget.TextView[@content-desc="Spinner"]');

// mob.pause(5000);
	
// const value = mob.getValue('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.LinearLayout/android.widget.Spinner[1]');

// log.info(value);






// mob.click('//android.widget.TextView[@content-desc="Controls"]');

// mob.pause(5000);

// mob.click('//android.widget.TextView[@content-desc="2. Dark Theme"]');

// mob.pause(5000);

// mob.hideKeyboard("pressKey", "Done");

// mob.pause(5000);

// mob.type('/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout[2]/android.widget.ScrollView/android.widget.LinearLayout/android.widget.LinearLayout[2]/android.widget.EditText', "0544501591");

// mob.pause(5000);

// const value = mob.getValue('id=io.appium.android.apis:id/edit');

// log.info(value);









// const caps = require('../assets/caps');
// const path = require('path');
// const apkPath = path.resolve(__dirname, '../assets/Volume-pre-production.apk');
// caps.app = apkPath;
// mob.init(caps);

// mob.transaction('Open celcom app');
// mob.waitForVisible("id=com.cellcom.volume:id/auth_phone_number");
// var el1 = mob.findElement("id=com.cellcom.volume:id/auth_phone_number");
// mob.click(el1);
// mob.transaction('type phone');
// mob.type(el1, "0544501591");
// mob.sendKeys("Enter");
// mob.pause(3000);

// const value = mob.getValue(el1);
// log.info(value);