declare namespace Oxygen {
	interface ModuleMob {
		/**
		 * @function init
		 * @summary Initializes a new Appium session.
		 * @param {Object=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
		 * @param {String=} appiumUrl - Remote Appium server URL (default: http://localhost:4723/wd/hub).
		 */
		init(caps?: Map<string, any>, appiumUrl?: string): void;

		/**
		 * @function getDriver
		 * @summary Returns the underlying WDIO driver.
		 * @return {Object} WDIO driver.
		 */
		getDriver(): any;

		/**
		 * @function getCapabilities
		 * @summary Returns currently defined capabilities.
		 * @return {Object} Current capabilities object.
		 */
		getCapabilities(): Map<string, any>;

		/**
		 * @summary Accepts an alert or a confirmation dialog.
		 * @description In case of an alert box this command is identical to `alertDismiss`.
		 * @function alertAccept
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=Submit");// Clicks an element and opens an alert.
		 * mob.alertAccept();//Automatically press on 'OK' button in the alert pop-up.
		*/
		alertAccept(): void;

		/**
		 * @summary Dismisses an alert or a confirmation dialog.
		 * @description In case of an alert box this command is identical to `alertAccept`.
		 * @function alertDismiss
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=Submit");// Clicks an element and opens an alert.
		 * mob.alertDismiss();//Automatically press on 'Cancel' button in the alert pop-up.
		*/
		alertDismiss(): void;

		/**
		 * @summary Asserts whether alert matches the specified pattern and dismisses it.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertAlert
		 * @for web
		 * @param {String} pattern - Text pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=Submit");// Clicks an element and opens an alert.
		 * mob.assertAlert("Your Alert's text");//Asserts the alert's text.
		 */
		assertAlert(pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts element's inner text.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns (on the top of page).
		 *  If the element is not interactable, then it will allways return empty string as its text.
		 * @function assertText
		 * @param {String|Element} locator - Element locator.
		 * @param {String} pattern - Assertion text or pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.assertText("id=UserName","John Doe");// Asserts if an element’s text is as expected.
		 */
		assertText(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts the page title.
		 * @description Assertion pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertTitle
		 * @param {String} pattern - Assertion text or pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.assertTitle("Your websites title!");// Asserts if the title of the page.
		 */
		assertTitle(pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts element's value.
		 * @function assertValue
		 * @param {String|Element} locator - Element locator.
		 * @param {String} pattern - Value pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.assertValue("id=UserName", "John Doe");// Asserts if the value of an element.
		 */
		assertValue(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Navigate backwards in the browser history or simulates back button on Android device.
		 * @function back
		 * @for android, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=NextPage);// Clicks an element and opens an alert.
		 * mob.back();//Navigate back to previous page.
		 */
		back(): void;

		/**
		 * @summary Clears element's value or content
		 * @function clear
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.type("id=Password", "Password");//Types a password to a field.
		 * mob.clear("id=Password");//Clears the characters from the field of an element.
		 
		*/
		clear(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Clicks on an element.
		 * @function click
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=Submit");// Clicks an element.
		 */
		click(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Clicks on a non-visible element.
		 * @function clickHidden
		 * @param {String|Element} locator - Element locator.
		 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.clickHidden("id=hiddenContent);// Clicks an hidden element.
		*/
		clickHidden(locator: string | Element, clickParent?: boolean | undefined): void;

		/**
		 * @summary Performs a long click/touch on an element.
		 * @function clickLong
		 * @param {String|Element} locator - Element locator.
		 * @param {Number} duration - Touch duration in milliseconds.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.clickLong("id=Mark",6000);// Clicks an element for a certain duration.
		 */
		clickLong(locator: string | Element, duration: number, timeout?: number | undefined): void;

		/**
		 * @summary Performs tap on an element multiple times in quick succession.
		 * @function clickMultipleTimes
		 * @param {String|Element} locator - Element locator.
		 * @param {Number} taps - Number of taps.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.clickMultipleTimes("id=Mark",4);// Clicks an element certain amount of times.
		 */
		clickMultipleTimes(locator: string | Element, taps: number, timeout?: number | undefined): void;

		/**
		 * @summary Closes the currently open app.
		 * @function closeApp
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * mob.launchApp(); // Launch the app.
		 * mob.closeApp(); // Close the app.
		*/
		closeApp(): void;

		/**
		 * @summary Stop test execution and allow interactive command execution (REPL).
		 * @function debug
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();
		 * mob.open("www.yourwebsite.com");
		 * mob.debug();
		 */
		debug(): void;

		/**
		 * @summary Tap on an element, drag by the specified offset, and release.
		 * @function dragAndDrop
		 * @param {String|Element} locator - Element locator on which to perform the initial tap.
		 * @param {Number} xoffset - Horizontal offset. Positive for right direction; Negative for left.
		 * @param {Number} yoffset - Vertical offset. Positive for down direction; Negative for up.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.dragAndDrop("id=Mark",-80,100);// Tap on an element, drag by the specified offset, and release.
		 */
		dragAndDrop(locator: string | Element, xoffset: number, yoffset: number, timeout?: number | undefined): void;

		/**
		 * @summary Enable or disable wifi or data.
		 * @function enableNetwork
		 * @param {Boolean} wifi - Enable (true) or disable (false) wifi.
		 * @param {Boolean} data - Enable (true) or disable (false) data.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.enableNetwork(true,false);//Enable wifi and disable data.
		 */
		enableNetwork(wifi: boolean, data: boolean): void;

		/**
		 * @summary Executes JavaScript in the context of the currently selected frame or window.
		 * @description If return value is null or there is no return value, `null` is returned.
		 * @function execute
		 * @param {String|Function} script - The JavaScript to execute.
		 * @param {...Object} arg - Optional arguments to be passed to the JavaScript function.
		 * @return {Object} The return value.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.execute(function(){
		 *    angular.element("#closeBtn").trigger('ng-click').click()
		 * });//Executes / injects a javascript functions.
		 */
		execute(...args: any[]): any;

		/**
		 * @summary Finds an element.
		 * @function findElement
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element} - A Element object.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var el = mob.findElement("id=Password");
		 * mob.click(el);
		*/
		findElement(locator: string, parent?: Element | undefined, timeout?: number | undefined): any;

		/**
		 * @summary Finds elements.
		 * @function findElements
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element[]} - Collection of Element objects.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var els = mob.findElements("//div");
		 * for (let el of els) {
		 *   var text = mob.getText(el);
		 *   log.info(text);
		 * }
		*/
		findElements(locator: string, parent?: Element | undefined, timeout?: number | undefined): any[];

		/**
		 * @summary Gets the text displayed by an alert or confirm dialog.
		 * @function getAlertText
		 * @return {String} - Alert's text.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=Submit");// Clicks an element and opens an alert.
		 * var a = mob.getAlertText();//Gets alert text.
		 */
		getAlertText(): string;

		/**
		 * @function getAppiumLogs
		 * @summary Collects logs from the Appium server.
		 * @return {Object[]} A list of logs.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
		 * mob.getAppiumLogs(); //Collects logs from the Appium server
		 */
		getAppiumLogs(): any[];

		/**
		 * @function getBrowserLogs
		 * @summary Collects browser logs from the mobile device.
		 * @return {Object[]} A list of logs.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
		 * mob.getBrowserLogs(); //Collects logs from the browser console
		 */
		getBrowserLogs(): any[];

		/**
		 * @summary Gets current Android app's activity name.
		 * @function getCurrentActivity
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * let activity = mob.getCurrentActivity(); // Gets current Android activity.
		*/
		getCurrentActivity(): string;

		/**
		 * @summary Gets current Android app's package name.
		 * @function getCurrentPackage
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * let package = mob.getCurrentPackage(); // Gets current Android package.
		*/
		getCurrentPackage(): string;

		/**
		 * @function getDeviceLogs
		 * @summary Collects logs from the mobile device.
		 * @return {Object[]} A list of logs.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
		 * mob.getDeviceLogs(); //Collects logs from the mobile device
		 */
		getDeviceLogs(): any[];

		/**
		 * @function getDeviceTime
		 * @summary Gets the time on the device.
		 * @return {String} Time.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
		 * mob.getDeviceTime(); //Gets the device time
		 */
		getDeviceTime(): string;

		/**
		 * @summary Get element's location.
		 * @function getLocation
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Object} - X and Y location of the element relative to top-left page corner.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var loc = mob.getLocation("id=element");//Get element's location.
		 * var x = loc.x;
		 * var y = loc.y;
		 */
		getLocation(locator: string | Element, timeout?: number | undefined): any;

		/**
		 * @function getSource
		 * @summary Gets the source code of the page.
		 * @return {String} - HTML in case of web or hybrid application or XML in case of native.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var a = mob.getSource();//Gets the source code of the page.
		 */
		getSource(): string;

		/**
		 * @summary Returns the text (rendered text shown to the user; whitespace-trimmed) of an element.
		 * @function getText
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} - Element's text.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var a = mob.getText("id=TextArea");//Gets the text from an element.
		 */
		getText(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Returns the title of the currently active window.
		 * @function getTitle
		 * @for web
		 * @return {String} The page title.
		 */
		getTitle(locator: any): string;

		/**
		 * @summary Gets the URL of the currently active window.
		 * @function getUrl
		 * @for web
		 * @return {String} The page URL.
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();//Opens browser session.
		 * mob.open("www.yourwebsite.com");// Opens a website.
		 * mob.getUrl();//Gets the url from the current page.
		 */
		getUrl(): string;

		/**
		 * @summary Gets element's value (whitespace-trimmed).
		 * @function getValue
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} - Element's value.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);
		 * var a = mob.getValue("id=ValueArea");//Gets the value from an element.
		 */
		getValue(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Gets handles of currently open windows.
		 * @function getWindowHandles
		 * @return {String[]} Array of all available window handles.
		 * @for web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();// Starts a mobile session.
		 * mob.open("www.yourwebsite.com");// Opens a website.
		 * mob.getWindowHandles();//Gets the window handles of currently open windows.
		 */
		getWindowHandles(): string[];

		/**
		 * @summary Hides device keyboard.
		 * @function hideKeyboard
		 * @param {String=} strategy - Strategy to use for closing the keyboard - 'press', 'pressKey',
		 *                              'swipeDown', 'tapOut', 'tapOutside', 'default'.
		 * @param {String=} key - Key value if strategy is 'pressKey'.
		 * @param {String=} keyCode - Key code if strategy is 'pressKey'.
		 * @param {String=} keyName - Key name if strategy is 'pressKey'.
		 * @for android, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.type("id=Password", "Password");//Types a password to a field.
		 * mob.hideKeyboard("pressKey", "Done");//Hides device keyboard.
		 */
		hideKeyboard(strategy?: string | undefined, key?: string | undefined, keyCode?: string | undefined, keyName?: string | undefined): void;

		/**
		 * @summary Install an app on the remote device.
		 * @function installApp
		 * @param {String} appLocalPath - The local file path to APK or IPA file.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * mob.installApp('/mylocalappfile.apk'); // Install the app.
		*/
		installApp(appLocalPath: string): void;

		/**
		 * @summary Determines if an app is installed on the device.
		 * @function isAppInstalled
		 * @param {String} app - App's ID.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); //Starts a mobile session and opens app from desired capabilities
		 * let installed = mob.isAppInstalled('com.android.calculator2'); // Determines if calculator app is installed.
		 */
		isAppInstalled(app: string): void;

		/**
		 * @summary Determines if checkbox or radio element is checkable.
		 * @function isCheckable
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is checkable. false otherwise.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isCheckable("id=checkBox");//Determines if checkbox or radio element is checkable.
		 */
		isCheckable(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if checkbox or radio element is checked.
		 * @function isChecked
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is checked. false otherwise.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isChecked("id=checkBox");//Determines if checkbox or radio element is checked.
		 */
		isChecked(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if an element is clickable.
		 * @function isClickable
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is clickable. false otherwise.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isClickable("id=Element");//Determines if element is clickable.
		 */
		isClickable(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Wait for an element to become available.
		 * @description The element is not necessary needs to be visible.
		 * @function isExist
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 * @return {Boolean} - true if the element exists. false otherwise.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isExist("id=Element");//Determines if element exists.
		 */
		isExist(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if an element is selected.
		 * @function isSelected
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is selected. false otherwise.
		 * @for android, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);
		 * var a = mob.isSelected("id=Selection");
		 * if (a) {
		 *   ...
		 * } else {
		 *   ...
		 * }
		 */
		isSelected(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Checks if element is present and visible. Returns false if element was not found or
		 *          wasn't visible within the specified timeout.
		 * @function isVisible
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
		 * @return {Boolean} True if element was found and it was visible. False otherwise.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isVisible("id=Selection");//Determines if element is visible.
		 */
		isVisible(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Checks if the current context is of WebView type.
		 * @function isWebViewContext
		 * @return {Boolean} - true if the context name is WEBVIEW or CHROMIUM.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.isWebViewContext();//Checks if the current context is of WebView type.
		 */
		isWebViewContext(): boolean;

		/**
		 * @summary Launches the app defined in the current session's capabilities.
		 * @function launchApp
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * mob.launchApp(); // Launch the app defined in the session's capabilities.
		*/
		launchApp(): void;

		/**
		 * @summary Press and hold a particular key code on the device.
		 * @function longPressKeyCode
		 * @param {Number} keycode - Key code pressed on the device.
		 * @for android, web
		 * @example <caption>[javascript] Usage example</caption>
		 * https://developer.android.com/reference/android/view/KeyEvent.html - list of key codes
		 * mob.init();//Starts a mobile session
		 * mob.open('https://keycode.info/');
		 * mob.longPressKeyCode(32);// 32 - d key
		 */
		longPressKeyCode(keycode: number): void;

		/**
		 * @summary Opens an URL.
		 * @description The `open` command waits for the page to load before proceeding.
		 * @function open
		 * @param {String} url - The URL to open; may be relative or absolute.
		 * @for web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.open('www.yourwebsite.com');//Opens an URL.
		 */
		open(url: string): void;

		/**
		 * @summary Pause test execution for the given amount of milliseconds.
		 * @function pause
		 * @param {Number} ms - Milliseconds to pause the execution for.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.pause(10*1000);//Pauses the execution for 10 seconds (10000ms)
		 */
		pause(ms: number): void;

		/**
		 * @summary Remove an app from the device.
		 * @function removeApp
		 * @param {String} app - App's ID.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * mob.removeApp('com.android.calculator2'); // Remove the calculator app from the device.
		 */
		removeApp(app: string): void;

		/**
		 * @summary Reset the currently running app's state (e.g. local settings) on the device.
		 * @function resetApp
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps); // Starts a mobile session and opens app from desired capabilities
		 * mob.resetApp(); // Reset curently running app
		 */
		resetApp(): void;

		/**
		 * @summary Scrolls the view element until a specified target element inside the view is found.
		 * @function scrollIntoElement
		 * @param {String} scrollElmLocator - View element to scroll.
		 * @param {String} findElmLocator - Target element to find in the view.
		 * @param {Number=} xoffset - Indicates the size in pixels of the horizontal scroll step (positive - scroll right, negative - scroll left). Default is 0.
		 * @param {Number=} yoffset - Indicates the size in pixels of the vertical scroll step (positive - scroll down, negative - scroll up). Default is 30.
		 * @param {Number=} retries - Indicates the number of scroll retries before giving up if element not found. Default is 50.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.scrollIntoElement('id=bottomPanel','id=Button',0,30,50);//Scrolls the view element until a specified target element inside the view is found.
		*/
		scrollIntoElement(scrollElmLocator: string, findElmLocator: string, xoffset?: number | undefined, yoffset?: number | undefined, retries?: number | undefined, timeout?: number | undefined, duration?: number | undefined): void;

		/**
		 * @summary Scrolls the page or a container element to the location of the specified element.
		 * @function scrollIntoView
		 * @param {String|Element} locator - An element locator.
		 * @param {Boolean|Object=} options - If `true`, the top of the element will be aligned to the top of the
		 * visible area of the scrollable ancestor. This is the default.
		 * If `false`, the bottom of the element will be aligned to the bottom of the visible area of the
		 * scrollable ancestor.
		 * This parameter can also accept an `options` object. See the usage example above.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.scrollIntoView('id=bottomPanel', true);
		 * // or
		 * mob.scrollIntoView('id=bottomPanel', {
		 *   behavior: 'auto', // Optional. Defines the transition animation: `auto` or `smooth`. Defaults to `auto`.
		 *   block: 'start',   // Optional. Defines vertical alignment - `start`, `center`, `end`, `nearest`. Defaults to `start`.
		 *   inline: 'start'   // Optional. Defines horizontal alignment - `start`, `center`, `end`, `nearest`. Defaults to `start`.
		 * });
		*/
		scrollIntoView(locator: string | Element, options?: (boolean | any) | undefined, timeout?: number | undefined): void;

		/**
		 * @summary Selects an option from a drop-down list using an option locator. This command works
		 *          with multiple-choice lists as well.
		 * @description Option locator can be one of the following (No prefix is same as label matching):
		 *              - `label=STRING` - Matches option based on the visible text.
		 *              - `value=STRING` - Matches option based on its value.
		 *              - `index=STRING` - Matches option based on its index. The index is 0-based.
		 * @function select
		 * @param {String} selectLocator - An element locator identifying a drop-down menu.
		 * @param {String} optionLocator - An option locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(); //Starts a mobile session
		 * mob.open("www.yourwebsite.com");// Opens a website.
		 * mob.select("id=Selection","label=United States");// Selects an option from a list.
		 */
		select(selectLocator: string, optionLocator: string, timeout?: number | undefined): void;

		/**
		 * @summary Selects a frame or an iframe within the current window.
		 * @description Available frame locators:
		 *              - `'parent'` - Select parent frame.
		 *              - `'top'` - Select top window.
		 *              - `NUMBER` - Select frame by its 0-based index.
		 *              - `LOCATOR` - Locator identifying the frame (relative to the top window).
		 *              Multiple locators can be passed in order to switch between nested frames.
		 * @function selectFrame
		 * @param {...String|Number} frameLocator - A locator identifying the frame or iframe. Or a series
		 *         of locators.
		 * @for hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.selectFrame("//iframe[@id='frame1']", "//iframe[@id='nested_frame']");
		 */
		selectFrame(...args: (string | number)[]): void;

		/**
		 * @summary Selects window. Once window has been selected, all commands go to that window.
		 * @description `windowLocator` can be:
		 * - `title=TITLE` Switch to the first window which matches the specified title. `TITLE` can be any of
		 * the supported string matching patterns (see top of the page). When using title locator, this command
		 * will wait for the window to appear first similarly to `waitForWindow` command.
		 * - `url=URL` Switch to the first window which matches the specified URL. `URL` can be any of
		 * the supported string matching patterns (see top of the page). When using url locator, this command
		 * will wait for the window to appear first similarly to `waitForWindow` command.
		 * - `windowHandle` Switch to a window using its unique handle.
		 * @function selectWindow
		 * @param {String=} windowLocator - Window locator.
		 * @param {Number=} timeout - Timeout in milliseconds when using 'title' window locating strategy.
		 *                             Default is 60 seconds.
		 * @return {String} windowHandle of the previously selected window.
		 * @for web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();// Starts a mobile session.
		 * mob.open("www.yourwebsite.com");// Opens a website.
		 * mob.selectWindow("title=Website");// Selects and focus a window.
		 */
		selectWindow(windowLocator?: string | undefined, timeout?: number | undefined): string;

		sendKeys(value: any): void;

		/**
		 * @function setContext
		 * @summary Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
		 * @param {String} context - The context name.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.setContext('NATIVE_APP');//Sets a specific context (NATIVE_APP, WEBVIEW, etc.).
		 */
		setContext(context: string): void;

		/**
		 * @summary Sets context to NATIVE_APP.
		 * @function setNativeContext
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.setNativeContext();//Sets context to NATIVE_APP.
		*/
		setNativeContext(): void;

		/**
		 * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
		 * @description This includes the `open` command, `waitFor*` commands, and commands which wait
		 *              for elements to appear in DOM or become visible before operating on them.
		 *              If command wasn't able to complete within the specified period it will fail the
		 *              test.
		 *              The default time-out is 60 seconds.
		 * @function setTimeout
		 * @for android, ios, hybrid, web
		 * @param {Number} timeout - A time-out in milliseconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();//Opens browser session.
		 * mob.setTimeout(60000);//Sets the time out to amount of milliseconds .
		 */
		setTimeout(timeout: number): void;

		/**
		 * @summary Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
		 * @function setWebViewContext
		 * @return {String} Context name, or null if no web context found.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.setWebViewContext();//Sets context to the first available WEBVIEW or CHROMIUM (Crosswalk WebView) view.
		 */
		setWebViewContext(): string;

		/**
		 * @summary Perform shake action on the device
		 * @description Supported on Android and iOS 9 or earlier versions.
		 * @function shake
		 * @for ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.shake();//Perform shake action on the device.
		 */
		shake(): void;

		/**
		 * @summary Clicks SMS message URL.
		 * @description `SMSPopup` application must be installed and running on the device to use this command.
		 *              https://github.com/oxygenhq/android-smspopup/releases
		 * @function smsClickLink
		 * @param {Number=} timeout - Time in milliseconds to wait for sms popup. Default is 60 seconds.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=sendSmS");// Clicks an element.
		 * mob.smsClickLink(60000);//Clicks SMS message URL.
		*/
		smsClickLink(timeout?: number | undefined): void;

		/**
		 * @summary Gets SMS text on Android phone.
		 * @description `SMSPopup` application must be installed and running on the device to use this command.
		 *              https://github.com/oxygenhq/android-smspopup/releases
		 * @function smsGetText
		 * @param {Number=} timeout - Time in milliseconds to wait for sms popup. Default is 60 seconds.
		 * @return {String} - SMS text.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.click("id=sendSmS");// Clicks an element.
		 * var a = mob.smsGetText(60000);//Gets SMS text on Android phone.
		*/
		smsGetText(timeout?: number | undefined): string;

		/**
		 * @summary Perform a swipe on an element.
		 * @function swipe
		 * @param {String|Element} locator - Locator of the element to swipe on.
		 * @param {Number=} xoffset - Horizontal offset (positive - scroll right, negative - scroll left). Default is 0.
		 * @param {Number=} yoffset - Vertical offset (positive - scroll down, negative - scroll up). Default is 30.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.swipe("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
		*/
		swipe(locator: string | Element, xoffset?: number | undefined, yoffset?: number | undefined, timeout?: number | undefined, duration?: number | undefined): void;

		/**
		 * @summary Perform swipe on the element.
		 * @function swipeElement
		 * @param {String} locator - Locator of the element to swipe on.
		 * @param {Number=} xoffset - Horizontal offset (positive - scroll right, negative - scroll left). Default is 0.
		 * @param {Number=} yoffset - Vertical offset (positive - scroll down, negative - scroll up). Default is 30.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.swipeElement("id=Element",-60,0,150);//Perform a swipe on the screen or an element.
		*/
		swipeElement(locator: string, xoffset?: number | undefined, yoffset?: number | undefined, timeout?: number | undefined, duration?: number | undefined): void;

		/**
		 * @summary Perform a swipe on the screen.
		 * @function swipeScreen
		 * @param {Number} x1 - Starting X position (top-left screen corner is the origin)
		 * @param {Number} y1 - Starting Y position.
		 * @param {Number} x2 - Ending X position.
		 * @param {Number} y2 - Ending Y position.
		 * @param {Number=} duration - Duration of swipe. Default is 3000 (3sec)
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.swipeScreen(0, 0, 0, 900);//Perform a swipe on the screen
		*/
		swipeScreen(x1: number | undefined, y1: number | undefined, x2: any, y2: any, duration?: number | undefined): void;

		/**
		 * @function takeScreenshot
		 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
		 * @return {String} Screenshot image encoded as a base64 string.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * var ss = mob.takeScreenshot();//Take a screenshot of the current page or screen and return it as base64 encoded string.
		 * require("fs").writeFileSync("c:\\screenshot.png", ss, 'base64');
		 */
		takeScreenshot(): string;

		/**
		 * @summary Perform tap at the specified coordinate.
		 * @function tap
		 * @param {Number} x - x offset.
		 * @param {Number} y - y offset.
		 * @for android, ios
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.tap(60,300);//Perform tap at the specified coordinate.
		 */
		tap(x: number, y: number): void;

		/**
		 * @summary Send a sequence of key strokes to an element (clears value before).
		 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
		 *              for the list of supported raw keyboard key codes.
		 * @function type
		 * @param {String|Element} locator - An element locator.
		 * @param {String} value - The value to type.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.type('id=TextArea', 'hello world\uE007');
		 */
		type(locator: string | Element, value: string, timeout?: number | undefined): void;

		/**
		 * @summary Unlocks a pattern lock
		 * @function unlockPattern
		 * @param {String|Element} locator - Element locator for the pattern lock.
		 * @param {Number} cols - Number of columns in the pattern.
		 * @param {Number} rows - Number of rows in the pattern.
		 * @param {String} pattern - Pattern sequence. Pins are hexadecimal and case sensitive. See example.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>Pattern pins are treated similarly as the numbers of a phone dial. E.g. 3x4 pattern:</caption>
		 * 1 2 3
		 * 4 5 6
		 * 7 8 9
		 * a b c
		 * @for android
		 */
		unlockPattern(locator: string | Element, cols: number, rows: number, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Wait for an element for the provided amount of milliseconds to exist in DOM.
		 * @description The element is not necessary needs to be visible.
		 * @function waitForExist
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.waitForExist('id=Element');//Wait for an element for the provided amount of milliseconds to exist in DOM.
		 */
		waitForExist(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become interactable.
		 * @function waitForInteractable
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init();//Opens browser session.
		 * mob.waitForInteractable("id=UserName");//Waits for an element is clickable in DOM.
		 */
		waitForInteractable(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become visible.
		 * @function waitForVisible
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 * @for android, ios, hybrid, web
		 * @example <caption>[javascript] Usage example</caption>
		 * mob.init(caps);//Starts a mobile session and opens app from desired capabilities
		 * mob.waitForVisible("id=Title", 45*1000);//Waits for an element to  be visible.
		 */
		waitForVisible(locator: string | Element, timeout?: number | undefined): void;
	}
}