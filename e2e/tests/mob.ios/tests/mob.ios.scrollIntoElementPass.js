const caps3 = require('../assets/caps3');

mob.init(caps3);

mob.scrollIntoElement(
    '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeTable',
    '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeTable/XCUIElementTypeCell[18]',
    0,
    -10
);

mob.pause(15000);

mob.swipe(
    '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeTable/XCUIElementTypeCell[1]',
    0,
    -300
);

mob.pause(15000);

mob.swipeElement(
    '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeTable/XCUIElementTypeCell[1]',
    0,
    600
);

mob.swipeScreen(0,0,0, -900);

mob.pause(25000);