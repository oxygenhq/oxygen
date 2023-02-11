declare namespace Oxygen {
	interface ModuleWin {
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
		 * @summary Asserts element's inner text.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 *  If the element is not interactable, then it will allways return empty string as its text.
		 * @function assertText
		 * @param {String|Element} locator - Element locator.
		 * @param {String} pattern - Assertion text or pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		assertText(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts the page title.
		 * @description Assertion pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertTitle
		 * @param {String} pattern - Assertion text or pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		assertTitle(pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts element's value.
		 * @function assertValue
		 * @param {String|Element} locator - Element locator.
		 * @param {String} pattern - Value pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		assertValue(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Navigate backwards in the browser history or simulates back button on Android device.
		 * @function back
		 */
		back(): void;

		/**
		 * @summary Clears element's value or content
		 * @function clear
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		clear(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Clicks on an element.
		 * @function click
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		click(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Performs a long click/touch on an element.
		 * @function clickLong
		 * @param {String|Element} locator - Element locator.
		 * @param {Number} duration - Touch duration in milliseconds.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		clickLong(locator: string | Element, duration: number, timeout?: number | undefined): void;

		/**
		 * @summary Performs tap on an element multiple times in quick succession.
		 * @function clickMultipleTimes
		 * @param {String|Element} locator - Element locator.
		 * @param {Number} taps - Number of taps.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		clickMultipleTimes(locator: string | Element, taps: number, timeout?: number | undefined): void;

		/**
		 * @summary Finds an element.
		 * @function findElement
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element} - A Element object.
		*/
		findElement(locator: string, parent?: Element | undefined, timeout?: number | undefined): Element;

		/**
		 * @summary Finds elements.
		 * @function findElements
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element[]} - Collection of Element objects.
		*/
		findElements(locator: string, parent?: Element | undefined, timeout?: number | undefined): Element[];

		/**
		 * @function getAppiumLogs
		 * @summary Collects logs from the Appium server.
		 * @return {Object[]} A list of logs.
		 */
		getAppiumLogs(): any[];

		/**
		 * @summary Gets current window handle.
		 * @function getCurrentWindowHandle
		 * @return {String} A window handle.
		 * @example <caption>[javascript] Usage example</caption>
		 * win.init();
		 * win.getCurrentWindowHandle();
		 */
		getCurrentWindowHandle(): string;

		/**
		 * @summary Get element's location.
		 * @function getLocation
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Object} - X and Y location of the element relative to top-left page corner.
		 */
		getLocation(locator: string | Element, timeout?: number | undefined): any;

		/**
		 * @function getSource
		 * @summary Gets the source code of the page.
		 * @return {String} - HTML in case of web or hybrid application or XML in case of native.
		 */
		getSource(): string;

		/**
		 * @summary Returns the text (rendered text shown to the user; whitespace-trimmed) of an element.
		 * @function getText
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} - Element's text.
		 */
		getText(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Gets element's value (whitespace-trimmed).
		 * @function getValue
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} - Element's value.
		 */
		getValue(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Gets handles of currently open windows.
		 * @function getWindowHandles
		 * @return {String[]} Array of all available window handles.
		 * @example <caption>[javascript] Usage example</caption>
		 * win.init();//Opens WinAppDriver session.
		 * win.getWindowHandles();//Gets the window handles of currently open application.
		 */
		getWindowHandles(): string[];

		/**
		 * @summary Determines if checkbox or radio element is checkable.
		 * @function isCheckable
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is checkable. false otherwise.
		 */
		isCheckable(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if checkbox or radio element is checked.
		 * @function isChecked
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is checked. false otherwise.
		 */
		isChecked(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if an element is clickable.
		 * @function isClickable
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is clickable. false otherwise.
		 */
		isClickable(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Wait for an element to become available.
		 * @description The element is not necessary needs to be visible.
		 * @function isExist
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 * @return {Boolean} - true if the element exists. false otherwise.
		 */
		isExist(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines if an element is selected.
		 * @function isSelected
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is selected. false otherwise.
		 */
		isSelected(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Checks if element is present and visible. Returns false if element was not found or
		 *          wasn't visible within the specified timeout.
		 * @function isVisible
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
		 * @return {Boolean} True if element was found and it was visible. False otherwise.
		 */
		isVisible(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Opens an URL.
		 * @description The `open` command waits for the page to load before proceeding.
		 * @function open
		 * @param {String} url - The URL to open; may be relative or absolute.
		 */
		open(url: string): void;

		/**
		 * @summary Pause test execution for the given amount of milliseconds.
		 * @function pause
		 * @param {Number} ms - Milliseconds to pause the execution for.
		 */
		pause(ms: number): void;

		/**
		 * @summary Perform right click on an element.
		 * @function rightClick
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		rightClick(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Selects window. Once window has been selected, all commands go to that window.
		 * @description `windowLocator` can be:
		 * - `title=TITLE` Switch to the first window which matches the specified title. `TITLE` can be any of
		 * the supported string matching patterns (see top of the page). When using title locator, this command
		 * will wait for the window to appear first similarly to `waitForWindow` command.
		 * - `windowHandle` Switch to a window using its unique handle.
		 * @function selectWindow
		 * @param {String=} windowLocator - Window locator.
		 * @param {Number=} timeout - Timeout in milliseconds when using 'title' window locating strategy.
		 *                             Default is 60 seconds.
		 * @return {String} windowHandle of the previously selected window.
		 * @example <caption>[javascript] Usage example</caption>
		 * win.init();
		 * win.selectWindow("title=FolderName");// Selects and focus a window.
		 */
		selectWindow(windowHandle: any, timeout?: number | undefined): string;

		/**
		 * @summary Send a sequence of keyboard strokes to the active window or element.
		 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
		 *              for the list of supported raw keyboard key codes.
		 * @function sendKeys
		 * @param {(String|String[])} value - Sequence of key strokes to send. Can be either a string or an
		 *                                  array of strings for sending raw key codes.
		 * @example <caption>[javascript] Usage example</caption>
		 * win.init();//Opens browser session.
		 * win.open("www.yourwebsite.com");// Opens a website.
		 * win.sendKeys("Hello World");
		 * win.sendKeys(["Backspace", "Backspace", "Enter"]); // send two Backspace key codes and Enter.
		 * // Unicode representation can be used directly as well:
		 * win.sendKeys("Hello World\uE003\uE003\uE007");
		*/
		sendKeys(value: (string | string[])): void;

		/**
		 * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
		 * @description This includes the `open` command, `waitFor*` commands, and commands which wait
		 *              for elements to appear in DOM or become visible before operating on them.
		 *              If command wasn't able to complete within the specified period it will fail the
		 *              test.
		 *              The default time-out is 60 seconds.
		 * @function setTimeout
		 * @param {Number} timeout - A time-out in milliseconds.
		 */
		setTimeout(timeout: number): void;

		/**
		 * @function takeScreenshot
		 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
		 * @return {String} Screenshot image encoded as a base64 string.
		 * @example <caption>[javascript] Usage example</caption>
		 * win.init(caps);
		 * var ss = win.takeScreenshot();//Take a screenshot and return it as base64 encoded string.
		 * require("fs").writeFileSync("c:\\screenshot.png", ss, 'base64');
		 */
		takeScreenshot(): string;

		/**
		 * @summary Perform tap at the specified coordinate.
		 * @function tap
		 * @param {Number} x - x offset.
		 * @param {Number} y - y offset.
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
		 */
		type(locator: string | Element, value: string, timeout?: number | undefined): void;

		/**
		 * @summary Wait for an element for the provided amount of milliseconds to exist in DOM.
		 * @description The element is not necessary needs to be visible.
		 * @function waitForExist
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 */
		waitForExist(locator: string | Element, timeout?: number | undefined): void;

		waitForInteractable(locator: any, timeout: any): void;

		/**
		 * @summary Waits for element to become visible.
		 * @function waitForVisible
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Time in milliseconds to wait for the element. Default is 60 seconds.
		 */
		waitForVisible(locator: string | Element, timeout?: number | undefined): void;
	}
}
