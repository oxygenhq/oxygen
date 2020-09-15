const caps = require('../assets/caps');
const path = require('path');
const apkPath = path.resolve(__dirname, '../assets/ApiDemos-debug.apk');
caps.app = apkPath;
mob.init(caps);
mob.setTimeout(6000);

mob.click('//android.widget.TextView[@content-desc="Views"]');

mob.click('//android.widget.TextView[@content-desc="Drag and Drop"]');

mob.pause(5000);

const dropElm = mob.findElement('/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.RelativeLayout/android.view.View[2]');

const dropLocation = dropElm.getLocation();

log.info(dropLocation);

mob.dragAndDrop(
    "/hierarchy/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[2]/android.widget.RelativeLayout/android.view.View[1]",
    dropLocation.x+50,
    dropLocation.y+50
);

mob.pause(15000);