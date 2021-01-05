const caps3 = require('../assets/caps3');
mob.init(caps3);

const toWebViewPathClick = '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeTable/XCUIElementTypeCell[18]';
const webViewPAth = '//XCUIElementTypeApplication[@name="UIKitCatalog"]/XCUIElementTypeWindow[1]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeWebView';

mob.click(toWebViewPathClick);

mob.waitForExist(webViewPAth);
mob.waitForVisible(webViewPAth);

assert.pass();

let isWebViewContext = mob.isWebViewContext();
log.info('isWebViewContext 1');
log.info(isWebViewContext);
assert.equal(isWebViewContext, false);

mob.setNativeContext();

isWebViewContext = mob.isWebViewContext();
log.info('isWebViewContext 3');
log.info(isWebViewContext);
assert.equal(isWebViewContext, false);

mob.setContext('NATIVE_APP');
isWebViewContext = mob.isWebViewContext();
log.info('isWebViewContext 4');
log.info(isWebViewContext);
assert.equal(isWebViewContext, false);
