declare namespace Oxygen {
	interface ModuleWeb {
		/**
		 * @summary Initializes new Selenium session.
		 * @function init
		 * @param {String=} caps - Desired capabilities. If not specified capabilities will be taken from suite definition.
		 * @param {String=} seleniumUrl - Remote server URL (default: http://localhost:4444/wd/hub).
		 */
		init(caps?: Map<string, any> | undefined, seleniumUrl?: string | undefined): void;

		/**
		 * @function dispose
		 * @summary Ends the current session.
		 * @param {String=} status - Test status, either `passed` or `failed`.
		 */
		dispose(status?: string | undefined): void;

		/**
		 * @summary Opens new transaction.
		 * @description The transaction will persist till a new one is opened. Transaction names must be
		 *              unique.
		 * @function transaction
		 * @param {String} name - The transaction name.
		 */
		transaction(name: string): void;

		/**
		 * @summary Accepts an alert or a confirmation dialog.
		 * @description In case of an alert box this command is identical to `alertDismiss`.
		 * @function alertAccept
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
		 * web.alertAccept();//Clicks on "OK" in the alert dialog.
		 */
		alertAccept(): void;

		/**
		 * @summary Dismisses an alert or a confirmation dialog.
		 * @description In case of an alert box this command is identical to `alertAccept`.
		 * @function alertDismiss
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
		 * web.alertDismiss();//Clicks on Cancel in the alert dialog.
		 */
		alertDismiss(): void;

		/**
		 * @summary Asserts whether alert matches the specified pattern and dismisses it.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertAlert
		 * @param {String} pattern - Text pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.click("id=SaveButton");//Clicks on save – an alert would pop up
		 * web.assertAlert("Your Alert's text");//Asserts the alert's text.
		 */
		assertAlert(pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts whether element exists in the DOM.
		 * @function assertExist
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertExist ("id=Username");// Asserts if an element exists in the DOM.
		 */
		assertExist(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Asserts text of the currently selected option in a drop-down list.
		 * @description Assertion pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertSelectedLabel
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - The assertion pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Boolean=} waitForVisible - Wait for visible.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertSelectedLabel("id=Selection", "United States");// Asserts if an element's label is selected in the drop down list.
		 */
		assertSelectedLabel(locator: string | Element, pattern: string, timeout?: number | undefined, waitForVisible?: boolean | undefined): void;

		/**
		 * @summary Asserts value of the currently selected option in a drop-down list.
		 * @description Assertion pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertSelectedValue
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - The assertion pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Boolean=} waitForVisible - Wait for visible.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertSelectedValue("id=Selection", "3");// Asserts if an element's value is selected in the drop down list.
		 */
		assertSelectedValue(locator: string | Element, pattern: string, timeout?: number | undefined, waitForVisible?: boolean | undefined): void;

		/**
		 * @summary Asserts element's inner text.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 *  If the element is not interactable, then it will allways return empty string as its text.
		 * @function assertText
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Text pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertText ("id=UserName","John Doe");// Asserts if an element's text is as expected.
		 */
		assertText(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts whether the given text is *not* present on the page. That is, whether there are
		 *          no elements containing this text on the page.
		 * @function assertTextNotPresent
		 * @param {String|Element} text - Text.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertTextNotPresent("John Doe");// Asserts if a text is not presented somewhere on the page.
		 */
		assertTextNotPresent(text: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Asserts whether the given text is present somewhere on the page. That is whether an
		 *          element containing this text exists on the page.
		 * @function assertTextPresent
		 * @param {String} text - Text.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertTextPresent("John Doe");// Asserts if a text is presented somewhere on the page.
		 */
		assertTextPresent(text: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts the page title.
		 * @description Assertion pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertTitle
		 * @param {String} pattern - The assertion pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertTitle("Your websites title!");// Asserts the title of the page.
		 */
		assertTitle(pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Asserts element's value.
		 * @description Value pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function assertValue
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Value pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.assertValue("id=UserName", "John Doe");// Asserts the value of an element.
		 */
		assertValue(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Navigate backwards in the browser history.
		 * @function back
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.click("id=NextPage");//Clicks on next page link.
		 * web.back();//Navigate back to previous page.
		 */
		back(): void;

		/**
		 * @summary Clear the value of an input field.
		 * @function clear
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.type("id=Password", "Password");//Types a password to a field.
		 * web.clear("id=Password");//Clears the characters from the field of an element.
		 */
		clear(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Clicks on an element.
		 * @description If the click causes new page to load, the command waits for page to load before
		 *              proceeding.
		 * @function click
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.click("id=NextPage");//Clicks on next page link.
		 */
		click(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Clicks on a non-visible element.
		 * @description If the click causes new page to load, the command waits for page to load before
		 *              proceeding.
		 * @function clickHidden
		 * @param {String|Element} locator - An element locator.
		 * @param {Boolean=} clickParent - If true, then parent of the element is clicked.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.clickHidden("id=HiddenLink");
		 */
		clickHidden(locator: string | Element, clickParent?: boolean | undefined): void;

		/**
		 * @summary Closes the currently active window.
		 * @function closeWindow
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.closeWindow();//Closes the current window.
		 */
		closeWindow(): void;

		/**
		 * @summary Stop test execution and allow interactive command execution (REPL).
		 * @function debug
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * web.debug();
		 */
		debug(): void;

		/**
		 * @summary Delete cookies visible to the current page.
		 * @function deleteCookies
		 * @param {String|String[]=} names - Cookie name or a list of cookie names to delete.
		 */
		deleteCookies(names?: (string | string[]) | undefined): void;

		/**
		 * @summary Deselects an option from multiple-choice drop-down list.
		 * @description Option locator can be one of the following (No prefix is same as label matching):
		 *              - `label=STRING` Matches option based on the visible text.
		 *              - `value=STRING` Matches option based on its value.
		 *              - `index=STRING` Matches option based on its index. The index is 0-based.
		 * @function deselect
		 * @param {String} selectLocator - An element locator identifying a drop-down menu.
		 * @param {String} optionLocator - An option locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.deselect("id=Selection","label=United States");//Deselect option from multiple choice drop down list.
		 */
		deselect(selectLocator: string, optionLocator: string, timeout?: number | undefined): void;

		/**
		 * @summary Double clicks on an element.
		 * @function doubleClick
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.doubleClick("id=Mark");//Double clicks on a element.
		 */
		doubleClick(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Drag and Drop element into another element
		 * @function dragAndDrop
		 * @param {String} srcElement - Element to drag and drop.
		 * @param {String} dstElement - Destination element to drop into.
		 * @param {Number=} duration - How long the drag should take place.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example. Drops grey rectangle into red square.</caption>
		 * web.init();
		 * web.open('http://webdriverjs.christian-bromann.com/');
		 * web.dragAndDrop('id=overlay', '/html/body/section/div[1]');
		 * web.pause(10*1000);
		 */
		dragAndDrop(srcElement: string, dstElement: string, duration?: number | undefined, timeout?: number | undefined): void;

		/**
		 * @summary Executes JavaScript in the context of the currently selected frame or window.
		 * @description If return value is null or there is no return value, `null` is returned.
		 * @function execute
		 * @param {String|Function} script - The JavaScript to execute.
		 * @param {...Object} arg - Optional arguments to be passed to the JavaScript function.
		 * @return {Object} The return value.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.execute(function()
		 * {
		 *   angular.element(".password").trigger("ng-click").click()
		 * }
		 * );//Executes/injects JavaScript code.
		 
		*/
		execute(...args: any[]): any;

		fileBrowse(locator: any, filepath: any, timeout: any): void;

		/**
		 * @summary Finds an element.
		 * @function findElement
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element} - A Element object.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.open('https://www.wikipedia.org');
		 * var el = web.findElement("id=js-link-box-en");
		 * web.click(el);
		*/
		findElement(locator: string, parent?: Element | undefined, timeout?: number | undefined): Element;

		/**
		 * @summary Finds elements.
		 * @function findElements
		 * @param {String} locator - Element locator.
		 * @param {Element=} parent - Optional parent element for relative search.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Element[]} - Collection of Element objects.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.open('https://www.wikipedia.org');
		 * var els = web.findElements("//div");
		 * for (let el of els) {
		 *   var text = web.getText(el);
		 *   log.info(text);
		 * }
		*/
		findElements(locator: string, parent?: Element | undefined, timeout?: number | undefined): Element[];

		/**
		 * @summary Fullscreen Window.
		 * @function fullscreenWindow
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.fullscreenWindow();
		 */
		fullscreenWindow(): void;

		/**
		 * @summary Gets the text displayed by an alert or confirm dialog.
		 * @function getAlertText
		 * @return {String} The alert's text.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var text = web.getAlertText();//Gets the text in the alert dialog.
		 */
		getAlertText(): string;

		/**
		 * @summary Returns the element's attribute.
		 * @function getAttribute
		 * @param {String|Element} locator - An element locator.
		 * @param {String} attribute - The name of the attribute to retrieve.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} The attribute's value or null if no such attribute.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getAttribute("id=UserName","value");//Gets an attribute from an element.
		 */
		getAttribute(locator: string | Element, attribute: string, timeout?: number | undefined): string;

		/**
		 * @function getBrowserLogs
		 * @summary Collects logs from the browser console. Works only in Chrome.
		 * @return {Object[]} An array of browser console logs.
		 * @for chrome
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var logs = web.getBrowserLogs(); //Collects logs from the browser console
		 */
		getBrowserLogs(): any[];

		/**
		 * @summary Returns a specific cookie or a list of cookies visible to the current page.
		 * @function getCookies
		 * @param {String} names - Names of the cookies to retrieve.
		 * @return {String} The attribute's value.
		 */
		getCookies(names: string): string;

		/**
		 * @summary Returns the value of a CSS property of an element.
		 * @function getCssValue
		 * @param {String|Element} locator - An element locator.
		 * @param {String} propertyName - CSS property name.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} CSS property value or null if no such property.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getCssValue("id=UserName","color");//Gets a CSS value from an element.
		 */
		getCssValue(locator: string | Element, propertyName: string, timeout?: number | undefined): string;

		/**
		 * @summary Retrieves the count of elements matching the given locator.
		 * @function getElementCount
		 * @param {String|Element} locator - Element locator.
		 * @return {Number} Element count or 0 if no elements were found.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var count = web.getElementCount("//*[@class=Title]");//Gets the element count.
		 */
		getElementCount(locator: string | Element): number;

		/**
		 * @summary Gets source code of specified DOM element.
		 * @function getHTML
		 * @param {String|Element} locator - An element locator.
		 * @param {Boolean} includeElementTag - If true, it includes the element tag.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} - Source code of the element.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.getHTML("id=Username", false);
		 */
		getHTML(locator: string | Element, includeElementTag: boolean, timeout?: number | undefined): string;

		/**
		 * @summary Gets the source of the currently active window.
		 * @function getSource
		 * @return {String} The page source.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getSource();//Gets the source of the page.
		 */
		getSource(): string;

		/**
		 * @summary Returns the text (rendered text shown to the user; whitespace-trimmed) of an element.
		 * @function getText
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} The element's text.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var text = web.getText("id=Title");//Gets the text from an element.
		 */
		getText(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Returns the title of the currently active window.
		 * @function getTitle
		 * @return {String} The page title.
		 */
		getTitle(locator: any): string;

		/**
		 * @summary Gets the URL of the currently active window.
		 * @function getUrl
		 * @return {String} The page URL.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getUrl();//Gets the url from the current page.
		 */
		getUrl(): string;

		/**
		 * @summary Returns the (whitespace-trimmed) value of an input field.
		 * @function getValue
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {String} The value.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getValue("id=UserName");//Gets the value from an element.
		 */
		getValue(locator: string | Element, timeout?: number | undefined): string;

		/**
		 * @summary Gets handles of currently open windows.
		 * @function getWindowHandles
		 * @return {String[]} Array of all available window handles.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.getWindowHandles();//Gets the window handles of currently open windows.
		 */
		getWindowHandles(): string[];

		/**
		 * @summary Sets the size of the outer browser window.
		 * @function getWindowSize
		 * @return {Object} Size object. Example: { height: 1056, width: 1936, x: -8, y: -8 }
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * const sizeObject = web.getWindowSize();
		 */
		getWindowSize(): any;

		/**
		 * @summary Gets the source of the currently active window which displays `text/xml` page.
		 * @function getXMLPageSource
		 * @return {String} The XML page source.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var src = web.getXMLPageSource();//Gets the source of currently active window which displays `text/xml` page.
		 */
		getXMLPageSource(): string;

		/**
		 * @summary Return true if alert dialog is currently present on the screen.
		 * @function isAlertPresent
		 * @return {Boolean} True if alert is present, false otherwise.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * var alertPresent = web.isAlertPresent();//Returns true if  the alert dialog is displayed.
		 */
		isAlertPresent(): boolean;

		/**
		 * @summary _**deprecated**_ Use isSelected instead. Determines if checkbox or radio element is checked.
		 * @function isChecked
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is checked. false otherwise.
		 * @for android
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init(caps);
		 * var checked = web.isChecked("id=checkBox");
		 */
		isChecked(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Checks if element is present in the DOM. Returns false if element was not found
		 *          within the specified timeout.
		 * @function isExist
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
		 * @return {Boolean} True if element was found. False otherwise.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.isExist("id=SaveButton");// Returns true if  the element exists in page.
		 */
		isExist(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Returns true if the selected element is interactable.
		 * @description Element is considered interactable only if it exists, is visible, is within viewport (if not try scroll to it),
		 *              its center is not overlapped with another element, and is not disabled.
		 * @function isInteractable
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds to wait for element to appear. Default is 60 seconds.
		 * @return {Boolean} True if element is interactable. False otherwise.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * if (web.isInteractable("id=SaveButton")) {
		 *  // the element is interactable
		 * }
		 */
		isInteractable(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Determines whether an `option` or `input` element of type checkbox or radio is currently selected or not.
		 * @function isSelected
		 * @param {String|Element} locator - Element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @return {Boolean} - true if element is selected. false otherwise.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open('http://www.wikipedia.org');
		 * var a = web.isSelected("id=Selection");
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
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.isVisible("id=SaveButton");// Returns true if  the element is displayed in page.
		 */
		isVisible(locator: string | Element, timeout?: number | undefined): boolean;

		/**
		 * @summary Makes hidden element visible.
		 * @description This a workaround command for situations which require manipulation of hidden
		 * elements, such as when using `web.type` command for file input fields which tend to be hidden.
		 * Specifically `makeVisible` will apply following styles to the specified element and all the
		 * parent elements:
		 * - visibility = 'visible' if set to 'hidden'
		 * - opacity = 1 if set to 0
		 * - display = 'block' if set to 'none'
		 * - width/height = 1px if set to 0.
		 * @function makeVisible
		 * @param {String|Element} locator - An element locator. If multiple elements match the locator, visibility
		 *                           is applied to all.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.makeVisible("id=SaveButton");// Makes an invisible/hidden element to become visible.
		 */
		makeVisible(locator: string | Element): void;

		/**
		 * @summary Maximize Window.
		 * @function maximizeWindow
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.maximizeWindow();
		 */
		maximizeWindow(): void;

		/**
		 * @summary Minimize Window.
		 * @function minimizeWindow
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.minimizeWindow();
		 */
		minimizeWindow(): void;

		/**
		 * @summary Opens new tab.
		 * @description The `newWindow` command waits for the page to load before proceeding.
		 * @function newWindow
		 * @param {String} url - The URL to open; may be relative or absolute.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.newWindow("www.yourwebsite.com");// Opens a website on new window.
		 */
		newWindow(url: string): void;

		/**
		 * @summary Opens an URL.
		 * @description The `open` command waits for the page to load before proceeding.
		 * @function open
		 * @param {String} url - The URL to open; may be relative or absolute.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 */
		open(url: string): void;

		/**
		 * @summary Pause test execution for the given amount of milliseconds.
		 * @function pause
		 * @param {Number} ms - Milliseconds to pause the execution for.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.pause(10*1000);//Pauses the execution for 10 seconds (10000ms)
		 */
		pause(ms: number): void;

		/**
		 * @summary Points the mouse cursor over the specified element.
		 * @function point
		 * @param {String|Element} locator - An element locator. If the element is not visible, it will be scrolled into view.
		 * @param {Number=} xOffset - X offset to move to, relative to the top-left corner of the element.
									 If not specified, the mouse will move to the middle of the element.
		* @param {Number=} yOffset  - Y offset to move to, relative to the top-left corner of the element.
									If not specified, the mouse will move to the middle of the element.
		* @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		* @example <caption>[javascript] Usage example</caption>
		* web.init();//Opens browser session.
		* web.open("www.yourwebsite.com");// Opens a website.
		* web.point("id=Selection");//Hovers a mouse over an element.
		*/
		point(locator: string | Element, xOffset?: number | undefined, yOffset?: number | undefined, timeout?: number | undefined): void;

		/**
		 * @summary Points the mouse cursor over the specified element.
		 * @description This method is similar to `web.point`, however it simulates the action using
		 *              JavaScript instead of using WebDriver's functionality which doesn't work in all cases.
		 * @function pointJS
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 */
		pointJS(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Causes the browser to reload the page.
		 * @function refresh
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.refresh();//Reloads the page
		 */
		refresh(): void;

		/**
		 * @summary Perform right click on an element.
		 * @function rightClick
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * web.rightClick("id=someElement");
		 */
		rightClick(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Perform right click on an element.
		 * @function rightClickActions
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @param {Number=} xOffset - x offset in pixels. Default is 0.
		 * @param {Number=} yOffset - y offset in pixels. Default is 0.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * web.rightClickActions("id=someElement", 10, -5);
		 */
		rightClickActions(locator: string | Element, xOffset?: number | undefined, yOffset?: number | undefined, timeout?: number | undefined): Promise<any>;

		/**
		 * @summary Scrolls the page or a container element to the location of the specified element.
		 * @function scrollToElement
		 * @param {String|Element} locator - An element locator.
		 * @param {Boolean=} alignToTop - If true, the top of the element will be aligned to the top of the
		 *                                visible area of the scrollable ancestor. This is the default.
		 *                                If false, the bottom of the element will be aligned to the bottom
		 *                                of the visible area of the scrollable ancestor.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.scrollToElement("id=Button", true);// Scrolls to an element.
		 */
		scrollToElement(locator: string | Element, alignToTop?: boolean | undefined, timeout?: number | undefined): void;

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
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.select("id=Selection","label=United States");// Selects an option from a list.
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
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");
		 * web.selectFrame("//iframe[@id='frame1']", "//iframe[@id='nested_frame']");
		 * web.click("id=SaveButton");//Clicks on element that exists in the second iframe
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
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.selectWindow("title=Website");// Selects and focus a window.
		 */
		selectWindow(windowLocator?: string | undefined, timeout?: number | undefined): string;

		/**
		 * @summary Send a sequence of keyboard strokes to the active window or element.
		 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
		 *              for the list of supported raw keyboard key codes.
		 * @function sendKeys
		 * @param {(String|String[])} value - Sequence of key strokes to send. Can be either a string or an
		 *                                  array of strings for sending raw key codes.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.sendKeys("Hello World");
		 * web.sendKeys(["Backspace", "Backspace", "Enter"]); // send two Backspace key codes and Enter.
		 * // Unicode representation can be used directly as well:
		 * web.sendKeys("Hello World\uE003\uE003\uE007");
		*/
		sendKeys(value: (string | string[])): void;

		/**
		 * @summary Wait for Angular based app will be loaded
		 * @function setAutoWaitForAngular
		 * @param {Boolean} autoWaitForAngular - true to enable auto-wait. false to disable.
		 * @param {String=} rootSelector - Selector for root element, needed only for AngularJS (v1). 
 		 *                                 In Angular (v2) first available root node will be selected automatically.
 		 * @param {Boolean=} softWait - If true then do not produce error if stability cannot be attained. Default is false.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * web.setAutoWaitForAngular(true);
		 */
		setAutoWaitForAngular(autoWaitForAngular?: boolean, rootSelector?: string | undefined, softWait?: boolean | undefined, timeout?: number | undefined): void;

		/**
		 * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
		 * @description This includes the `open` command, `waitFor*` commands, and commands which wait
		 *              for elements to appear in DOM or become visible before operating on them.
		 *              If command wasn't able to complete within the specified period it will fail the
		 *              test.
		 *              The default time-out is 60 seconds.
		 * @function setTimeout
		 * @param {Number} timeout - A time-out in milliseconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.setTimeout(60000);//Sets the time out to amount of milliseconds .
		 */
		setTimeout(timeout: number): void;

		/**
		 * @summary Sets the size of the outer browser window.
		 * @function setWindowSize
		 * @param {Number} width - Width in pixels.
		 * @param {Number} height - Height in pixels.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.setWindowSize(100,40);//Sets the window size (width and height) in pixels.
		 */
		setWindowSize(width: number, height: number): void;

		/**
		 * @function takeScreenshot
		 * @summary Take a screenshot of the current page or screen and return it as base64 encoded string.
		 * @return {String} Screenshot image encoded as a base64 string.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * var ss = web.takeScreenshot();
		 * require("fs").writeFileSync("c:\\screenshot.png", ss, 'base64');
		 */
		takeScreenshot(): string;

		/**
		 * @summary Send a sequence of key strokes to an element (clears value before).
		 * @description Refer to [Key Codes](https://w3c.github.io/webdriver/#keyboard-actions)
		 *              for the list of supported raw keyboard key codes.
		 * @function type
		 * @param {String|Element} locator - An element locator.
		 * @param {String} value - The value to type.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.type("id=UserName","User1");//Types a string to field.
		 */
		type(locator: string | Element, value: string, timeout?: number | undefined): void;

		/**
		 * @summary Wait for Angular based app will be loaded
		 * @function waitForAngular
		 * @param {String=} rootSelector - Selector for root element, needed only for AngularJS (v1). 
		 *                                 In Angular (v2) first available root node will be selected automatically.
		 * @param {Boolean=} softWait - If true then do not produce error if stability cannot be attained. Default is false.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();
		 * web.open("www.yourwebsite.com");
		 * web.waitForAngular();
		 */
		waitForAngular(rootSelector?: string | undefined, softWait?: boolean | undefined, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become available in the DOM.
		 * @function waitForExist
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForExist("id=UserName");//Waits for an element to exist in DOM.
		 */
		waitForExist(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become interactable.
		 * @function waitForInteractable
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForInteractable("id=UserName");//Waits for an element is clickable in DOM.
		 */
		waitForInteractable(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become unavailable in the DOM.
		 * @function waitForNotExist
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForNotExist("id=UserName");//Waits for an element to not exist in DOM.
		 */
		waitForNotExist(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for inner text of the given element to stop matching the specified pattern.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function waitForNotText
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Text pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForNotText("id=Title","Website");//Waits for an element’s text to not match to expected string.
		 */
		waitForNotText(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Waits for input element's value to stop matching the specified pattern.
		 * @description Value pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function waitForNotValue
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Value pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForNotValue("id=UserName","User");//Waits for an element’s value to not match to expected string.
		 */
		waitForNotValue(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Waits for inner text of the given element to match the specified pattern.
		 * @description Text pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function waitForText
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Text pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForText("id=Title","Website");//Waits for an element’s text to  match to expected string.
		 */
		waitForText(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Waits for input element's value to match the specified pattern.
		 * @description Value pattern can be any of the supported
		 *  string matching patterns(on the top of page).
		 * @function waitForValue
		 * @param {String|Element} locator - An element locator.
		 * @param {String} pattern - Value pattern.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForValue("id=Title","Website");//Waits for an element’s value to  match to expected string.
		 */
		waitForValue(locator: string | Element, pattern: string, timeout?: number | undefined): void;

		/**
		 * @summary Waits for element to become visible.
		 * @function waitForVisible
		 * @param {String|Element} locator - An element locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForVisible("id=Title", 45*1000);//Waits for an element to  be visible.
		 */
		waitForVisible(locator: string | Element, timeout?: number | undefined): void;

		/**
		 * @summary Waits for a window to appear, but doesn't actually switches to it.
		 * @description `windowLocator` can be:
		 * - `title=TITLE` Wait for the first window which matches the specified title. `TITLE` can be
		 * any of the supported  string matching patterns(see top of the page).
		 * - `url=URL` Wait for the first window which matches the specified URL. `URL` can be
		 * any of the supported string matching patterns(see top of the page).
		 * @function waitForWindow
		 * @param {String} windowLocator - A window locator.
		 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
		 * @example <caption>[javascript] Usage example</caption>
		 * web.init();//Opens browser session.
		 * web.open("www.yourwebsite.com");// Opens a website.
		 * web.waitForWindow("title=Website");//Waits for a window to appear.
		 */
		waitForWindow(windowLocator: string, timeout?: number | undefined): void;
	}
}