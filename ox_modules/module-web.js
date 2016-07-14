/**
 * Provides methods for browser automation. 
 * <br /><br />
 * <b><i>Notes:</i></b><br />
 * Commands which operate on elements such as click, assert, waitFor, type, select, and others will 
 * automatically wait for a period of time for the element to appear in DOM and become visible. By 
 * default this period equals to 60 seconds, but can be changed using the <code>setTimeout</code> 
 * command.
 * <br /><br />
 * <div id="patterns">Commands which expect a string matching pattern in their arguments, support 
 *  following patterns unless specified otherwise:
 *  <ul>
 *  <li><code>regex:PATTERN</code> - Match using regular expression.</li>
 *  <li><code>regexi:PATTERN</code> - Match using case-insensitive regular expression.</li>
 *  <li><code>exact:STRING</code> - Match the string verbatim.</li>
 *  <li><code>glob:PATTERN</code> - Match using case-insensitive glob pattern. 
 *      <code>?</code> will match any single character except new line (\n).
 *      <code>*</code> will match any sequence (0 or more) of characters except new line. Empty 
 *      PATTERN will match only other empty strings.</li>
 *  <li><code>PATTERN</code> - Same as glob matching.</li>
 *  </ul>
 * </div>
 * <div id="patterns">Commands which expect an element locator in their arguments, support 
 *  following locator types unless specified otherwise:
 *  <ul>
 *  <li><code>id=ID</code> - Locates element by its ID attribute.</li>
 *  <li><code>css=CSS_SELECTOR</code> - Locates element using a CSS selector.</li>
 *  <li><code>link=TEXT</code> - Locates link element whose visible text matches the given string.</li>
 *  <li><code>name=NAME</code>  - Locates element by its NAME attribute.</li>
 *  <li><code>xpath=XPATH</code>  - Locates element using an XPath 1.0 expression.</li>
 *  <li><code>/XPATH</code>  - Same as <code>xpath=XPATH</code></li>
 *  </ul>
 * </div>
 */
const STATUS = require('../model/status.js');

module.exports = function (argv, context, rs, logger, dispatcher) {
	var module = {};

	var ctx = context;
	var dispatcher = dispatcher;
    var rs = rs; // results store
    
    var _lastTransactionName;

	// call ModuleInit
	dispatcher.execute('web', 'moduleInit', argv);

    /**
     * @summary Initialize test settings and start correspondent Selenium server and browser.
     * @function init
     * @param {String} seleniumUrl - Selenium server url.
     * @param {Object} caps - Selenium capabilities.
     * @param {Boolean} resetDefaultCaps - If true default capabilities will be cleared, otherwise 
     *                                     custom capabilities will be merged with the default ones.
     */
    module.init = function ()
    {
    	return handleStepResult(dispatcher.execute('web', 'init', Array.prototype.slice.call(arguments)));
    };
    module.dispose = function ()
    {
    	return dispatcher.execute('web', 'moduleDispose', Array.prototype.slice.call(arguments));
    };
    module._iterationStart = function(vars)
    {
    	dispatcher.execute('web', 'iterationStart', { vars: ctx.vars });
    };
	module._iterationEnd = function(vars)
    {
    	var har = dispatcher.execute('web', 'iterationEnd', {});
		rs.har = har;
    };
    /**
     * @summary Sets base URL which can be used for relative navigation using the <code>open</code> 
     *          command.
     * @function setBaseUrl
     * @param {String} url - The base URL.
     */
    module.setBaseUrl = function () { return dispatcher.execute('web', 'setBaseUrl', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Opens new transaction.
     * @description The transaction will persist till a new one is opened. Transaction names must be
     *              unique.
     * @function transaction
     * @param {String} name - The transaction name.
     */
    module.transaction = function (name) { 
        _lastTransactionName = name;
        dispatcher.execute('web', 'transaction', Array.prototype.slice.call(arguments)); 
    };
    /**
     * @summary Specifies the amount of time that Oxygen will wait for actions to complete.
     * @description This includes the <code>open</code> command, <code>waitFor*</code> commands, and
     *              all other commands which wait for elements to appear or become visible before 
     *              operating on them.<br/>
     *              If command wasn't able to complete within the specified period it will fail the
     *              test.<br/>
     *              The default time-out is 60 seconds.
     * @function setTimeout
     * @param {Integer} timeout - A time-out in milliseconds.
     */
    module.setTimeout = function () { return dispatcher.execute('web', 'setTimeout', Array.prototype.slice.call(arguments)); };
    /**
     * @summary Opens an URL.
     * @description The <code>open</code> command waits for the page to load before proceeding.
     * @function open
     * @param {String} url - The URL to open; may be relative or absolute.
     */
    module.open = function () { return handleStepResult(dispatcher.execute('web', 'open', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Scrolls the page to the location of the specified element.
     * @description <i>yOffset</i> determines the offset from the specified element where to scroll 
     *              to. It can be either a positive or a negative value.
     * @function scrollToElement
     * @param {String} locator - An element locator.
     * @param {Integer} yOffset - Y offset from the element.
     */
    module.scrollToElement = function () { return handleStepResult(dispatcher.execute('web', 'scrollToElement', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Points the mouse cursor over the specified element.
     * @function point
     * @param {String} locator - An element locator.
     */
    module.point = function () { return handleStepResult(dispatcher.execute('web', 'point', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Clicks on a link, button, checkbox, or radio button. 
     * @description If the click causes new page to load, the command waits for page to load before 
     *              proceeding.
     * @function click
     * @param {String} locator - An element locator.
     */
    module.click = function () { return handleStepResult(dispatcher.execute('web', 'click', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Clicks on a non-visible link, button, checkbox, or radio button.
     * @description If the click causes new page to load, the command waits for page to load before 
     *              proceeding.
     * @function clickHidden
     * @param {String} locator - An element locator.
     */
    module.clickHidden = function() { return handleStepResult(dispatcher.execute('web', 'clickHidden', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts the page title.
     * @description Assertion pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertTitle
     * @param {String} pattern - The assertion pattern.
     */
    module.assertTitle = function() { return handleStepResult(dispatcher.execute('web', 'assertTitle', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Simulates keystroke events on the specified element, as though you typed the value 
     *          key-by-key. Previous value if any will be cleared.
     * @description Following special key codes are supported using the <code>'${KEY_CODE}'</code> 
     *              notation:<br/>
     *          KEY_BACKSPACE<br/>
     *          KEY_TAB<br/>
     *          KEY_ENTER<br/>
     *          KEY_SHIFT<br/>
     *          KEY_CTRL<br/>
     *          KEY_ALT<br/>
     *          KEY_PAUSE<br/>
     *          KEY_ESC<br/>
     *          KEY_SPACE<br/>
     *          KEY_PAGE_UP<br/>
     *          KEY_PAGE_DOWN<br/>
     *          KEY_END<br/>
     *          KEY_HOME<br/>
     *          KEY_LEFT<br/>
     *          KEY_UP<br/>
     *          KEY_RIGHT<br/>
     *          KEY_DOWN<br/>
     *          KEY_INSERT<br/>
     *          KEY_DELETE<br/>
     *          KEY_SEMICOLON<br/>
     *          KEY_EQUALS<br/>
     *          KEY_N0<br/>
     *          KEY_N1<br/>
     *          KEY_N2<br/>
     *          KEY_N3<br/>
     *          KEY_N4<br/>
     *          KEY_N5<br/>
     *          KEY_N6<br/>
     *          KEY_N7<br/>
     *          KEY_N8<br/>
     *          KEY_N9<br/>
     *          KEY_MULTIPLY<br/>
     *          KEY_ADD<br/>
     *          KEY_SUBSTRACT<br/>
     *          KEY_SEPARATOR<br/>
     *          KEY_DECIMAL<br/>
     *          KEY_DIVIDE<br/>
     *          KEY_F1<br/>
     *          KEY_F2<br/>
     *          KEY_F3<br/>
     *          KEY_F4<br/>
     *          KEY_F5<br/>
     *          KEY_F6<br/>
     *          KEY_F7<br/>
     *          KEY_F8<br/>
     *          KEY_F9<br/>
     *          KEY_F10<br/>
     *          KEY_F11<br/>
     *          KEY_F12<br/>
     *          KEY_META<br/>
     *          KEY_COMMAND
     * @function type
     * @param {String} locator - An element locator.
     * @param {String} value - The value to type.
     */
    module.type = function() { return handleStepResult(dispatcher.execute('web', 'type', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Clear the value of an input field.
     * @function clear
     * @param {String} locator - An element locator.
     */
    module.clear = function() { return handleStepResult(dispatcher.execute('web', 'clear', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts element's inner text.
     * @description Assertion pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertText
     * @param {String} locator - An element locator.
     * @param {String} pattern - The assertion pattern.
     */
    module.assertText = function() { return handleStepResult(dispatcher.execute('web', 'assertText', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Selects window. Once window has been selected, all commands go to that window.
     * @description <code>windowLocator</code> can be:
     *              <ul>
     *              <li><code>title=TITLE</code> - Switch to the first window which matches the 
     *                  specified title. TITLE can be any of the supported <a href="#patterns">
     *                  string matching patterns</a>.
     *              </li>
     *              <li>An empty string - Switch to the last opened window.</li>
     *              <li><code>windowHandle</code> - Switch to a window using its unique handle.</li>
     *              </ul>
     * @function selectWindow
     * @param {String} windowLocator - Window locator.
     * @return {String} windowHandle of the previously selected window.
     */
    module.selectWindow = function() { return handleStepResult(dispatcher.execute('web', 'selectWindow', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Returns the element's attribute.
     * @function getAttribute
     * @param {String} locator - An element locator.
     * @param {String} attributeName - The name of the attribute to retrieve.
     * @return {String} The attribute's value.
     */
    module.getAttribute = function() { return handleStepResult(dispatcher.execute('web', 'getAttribute', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Returns the text (rendered text shown to the user) of an element.
     * @function getText
     * @param {String} locator - An element locator.
     * @return {String} The element's text.
     */
    module.getText = function() { return handleStepResult(dispatcher.execute('web', 'getText', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Returns the (whitespace-trimmed) value of an input field. For checkbox/radio 
     *          elements, the value will be "on" or "off".
     * @function getValue
     * @param {String} locator - An element locator.
     * @return {String} The value.
     */
    module.getValue = function() { return handleStepResult(dispatcher.execute('web', 'getValue', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Double clicks on a link, button, checkbox, or radio button.
     * @function doubleClick
     * @param {String} locator - An element locator.
     */
    module.doubleClick = function() { return handleStepResult(dispatcher.execute('web', 'doubleClick', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Selects an option from a drop-down list using an option locator. This command works 
     *          with multiple-choice lists as well.
     * @description Option locator can be one of the following (No prefix is same as label matching):
     *              <ul>
     *              <li><code>label=STRING</code> - Matches option based on the visible text.</li>
     *              <li><code>value=STRING</code> - Matches option based on its value.</li>
     *              <li><code>index=STRING</code> - Matches option based on its index.</li>
     *              </ul>
     * @function select
     * @param {String} selectLocator - An element locator identifying a drop-down menu.
     * @param {String} optionLocator - An option locator.
     */
    module.select = function() { return handleStepResult(dispatcher.execute('web', 'select', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Deselects an option from multiple-choice drop-down list.
     * @description Option locator can be one of the following (No prefix is same as label matching):
     *              <ul>
     *              <li><code>label=STRING</code> - Matches option based on the visible text.</li>
     *              <li><code>value=STRING</code> - Matches option based on its value.</li>
     *              </ul>
     * @function deselect
     * @param {String} selectLocator - An element locator identifying a drop-down menu.
     * @param {String} optionLocator - An option locator.
     */
    module.deselect = function() { return handleStepResult(dispatcher.execute('web', 'deselect', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Pauses for the specified amount of time (in milliseconds).
     * @function pause
     * @param {Integer} waitTime - The amount of time to sleep (in milliseconds)
     */
    module.pause = function() { return handleStepResult(dispatcher.execute('web', 'pause', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for a popup window to appear.
     * @description <code>windowLocator</code> can be:
     *              <ul>
     *              <li><code>title=TITLE</code> - Wait for the first window which matches the 
     *                  specified title. TITLE can be any of the supported <a href="#patterns">
     *                  string matching patterns</a>.
     *              </li>
     *              <li>An empty string - Wait for any new window to appear.</li>
     *              </ul>
     * @function waitForPopUp
     * @param {String} windowLocator - A window locator.
     * @param {Integer} timeout - A timeout in milliseconds, after which the action will return with 
     *                           an error.
     */
    module.waitForPopUp = function() { return handleStepResult(dispatcher.execute('web', 'waitForPopUp', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Selects a frame within the current window.
     * @description Available frame locators:
     *              <ul>
     *              <li><code>relative=parent</code> - Select parent frame.</li>
     *              <li><code>relative=top</code> - Select top window.</li>
     *              <li><code>index=0</code> - Select frame by its 0-based index.</li>
     *              <li><code>//XPATH</code> - XPath expression relative to the top window which 
     *                  identifies the frame. Multiple XPaths can be concatenated using 
     *                  <code>;;</code> to switch between nested frames.</li>
     *              </ul>
     * @function selectFrame
     * @param {String} frameLocator - A locator identifying a frame or an iframe.
     */
    module.selectFrame = function() { return handleStepResult(dispatcher.execute('web', 'selectFrame', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for element to become visible.
     * @function waitForVisible
     * @param {String} locator - An element locator.
     */
    module.waitForVisible = function() { return handleStepResult(dispatcher.execute('web', 'waitForVisible', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for element to appear in the DOM. The element might be visible to the user or
     *          not.
     * @function waitForElementPresent
     * @param {String} locator - An element locator.
     */
    module.waitForElementPresent = function() { return handleStepResult(dispatcher.execute('web', 'waitForElementPresent', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Checks if element is present in the DOM. Returns false if element was not found 
     *          within the specified timeout.
     * @function isElementPresent
     * @param {String} locator - An element locator.
     * @param {Integer} timeout - Timeout in milliseconds to wait for element to appear.
     * @return {Boolean} True if element was found. False otherwise.
     */
    module.isElementPresent = function() { return handleStepResult(dispatcher.execute('web', 'isElementPresent', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Checks if element is present and visible. Returns false if element was not found or 
     *          wasn't visible within the specified timeout.
     * @function isElementVisible
     * @param {String} locator - An element locator.
     * @param {Integer} timeout - Timeout in milliseconds to wait for element to appear.
     * @return {Boolean} True if element was found and it was visible. False otherwise.
     */
    module.isElementVisible = function() { return handleStepResult(dispatcher.execute('web', 'isElementVisible', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for inner text of the given element to match the specified pattern.
     * @description Text pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function waitForText
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern.
     */
    module.waitForText = function() { return handleStepResult(dispatcher.execute('web', 'waitForText', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for inner text of the given element to stop matching the specified pattern.
     * @description Text pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function waitForNotText
     * @param {String} locator - An element locator.
     * @param {String} pattern - Text pattern.
     */
    module.waitForNotText = function() { return handleStepResult(dispatcher.execute('web', 'waitForNotText', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for input element's value to match the specified pattern.
     * @description Value pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function waitForValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Value pattern.
     */
    module.waitForValue = function() { return handleStepResult(dispatcher.execute('web', 'waitForValue', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Waits for input element's value to stop matching the specified pattern.
     * @description Value pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function waitForNotValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Value pattern.
     */
    module.waitForNotValue = function() { return handleStepResult(dispatcher.execute('web', 'waitForNotValue', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts element's value.
     * @description Value pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - Value pattern.
     */
    module.assertValue = function() { return handleStepResult(dispatcher.execute('web', 'assertValue', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts whether the given text is present somewhere on the page. That is whether an 
     *          element containing this text exists on the page.
     * @function assertTextPresent
     * @param {String} text - Text.
     */
    module.assertTextPresent = function() { return handleStepResult(dispatcher.execute('web', 'assertTextPresent', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts whether element exists in the DOM.
     * @function assertElementPresent
     * @param {String} locator - An element locator.
     */
    module.assertElementPresent = function() { return handleStepResult(dispatcher.execute('web', 'assertElementPresent', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts whether alert matches the specified pattern and dismisses it.
     * @description Text pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertAlert
     * @param {String} pattern - Text pattern.
     */
    module.assertAlert = function() { return handleStepResult(dispatcher.execute('web', 'assertAlert', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Gets the source of the currently active window.
     * @function getPageSource
     * @return {String} The page source.
     */
    module.getPageSource = function() { return handleStepResult(dispatcher.execute('web', 'getPageSource', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Gets the source of the currently active window which displays <code>text/xml</code> 
     *          page.
     * @function getXMLPageSource
     * @return {String} The XML page source.
     */
    module.getXMLPageSource = function() { return handleStepResult(dispatcher.execute('web', 'getXMLPageSource', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Gets the source of the currently active window which displays <code>text/xml</code> 
     *          page and returns it as JSON object.
     * @function getXMLPageSourceAsJSON
     * @return {String} The XML page source represented as a JSON string.
     */
    module.getXMLPageSourceAsJSON = function() { return handleStepResult(dispatcher.execute('web', 'getXMLPageSourceAsJSON', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Gets handles, titles, and URLs of the currently open windows.
     * @function getWindowHandles
     * @return {String} JSON array containing all available windows.
     */
    module.getWindowHandles = function() { return handleStepResult(dispatcher.execute('web', 'getWindowHandles', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Closes the currently active window.
     * @function closeWindow
     */
    module.closeWindow = function() { return handleStepResult(dispatcher.execute('web', 'closeWindow', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Closes the current session
     * @function quit
     */
    module.quit = function() { return handleStepResult(dispatcher.execute('web', 'quit', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Checks if alert box is present.
     * @function isAlertPresent
     * @param {String} text - Alert's text.
     * @param {Integer} timeout - Timeout in milliseconds to wait for the alert box.
     * @return {Boolean} True if alert with the specified text is present. False otherwise.
     */
    module.isAlertPresent = function() { return handleStepResult(dispatcher.execute('web', 'isAlertPresent', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Accepts an alert or a confirmation dialog. 
     * @description In case of an alert box this command is identical to <code>alertDismiss</code>.
     * @function alertAccept
     */
    module.alertAccept = function() { return handleStepResult(dispatcher.execute('web', 'alertAccept', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Dismisses an alert or a confirmation dialog.
     * @description In case of an alert box this command is identical to <code>alertAccept</code>.
     * @function alertDismiss
     */
    module.alertDismiss = function() { return handleStepResult(dispatcher.execute('web', 'alertDismiss', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts text of the currently selected option in a drop-down list.
     * @description Assertion pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertSelectedLabel
     * @param {String} locator - An element locator.
     * @param {String} pattern - The assertion pattern.
     */
    module.assertSelectedLabel = function() { return handleStepResult(dispatcher.execute('web', 'assertSelectedLabel', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Asserts value of the currently selected option in a drop-down list.
     * @description Assertion pattern can be any of the supported <a href="#patterns">
     *              string matching patterns</a>.
     * @function assertSelectedValue
     * @param {String} locator - An element locator.
     * @param {String} pattern - The assertion pattern.
     */
    module.assertSelectedValue = function() { return handleStepResult(dispatcher.execute('web', 'assertSelectedValue', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Gets the text displayed by an alert or confirm dialog.
     * @function getAlertText
     * @return {String} The alert's text.
     */
    module.getAlertText = function() { return handleStepResult(dispatcher.execute('web', 'getAlertText', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Executes JavaScript in the context of the currently selected frame or window.
     * @description The return value is serialized into a JSON string. If the value is null or there
     *              is no return value, <code>null</code> is returned. <br/>
     *              DOM object return values are not supported. If value is a DOM object such as 
     *              <code>document</code> or an element returned by <code>getElementById()</code>, 
     *              null is returned instead.<br/>
     *              If the value cannot be serialized due to its size or circular-references the 
     *              test will fail with "Maximum call stack size exceeded" error.
     * @function executeScript
     * @param {String} script - The JavaScript to execute.
     * @return {String} The return value serialized as a JSON string.
     */
    module.executeScript = function () { return handleStepResult(dispatcher.execute('web', 'executeScript', Array.prototype.slice.call(arguments))); };
    /**
     * @summary Retrieves the count of elements matching the given XPath expression.
     * @function getElementCount
     * @param {String} xpath - XPath locator.
     * @return {Integer} Element count or 0 if no elements were found.
     */
    module.getElementCount = function() { return handleStepResult(execMethod('web', 'getElementCount', Array.prototype.slice.call(arguments))); };
    
    module.fileBrowse = function() { return handleStepResult(execMethod('web', 'fileBrowse', Array.prototype.slice.call(arguments))); };
    
    function handleStepResult(res)
    {
    	//console.log(JSON.stringify(res));
        if (res.CommandResult)
        {
            var StepResult = require('../model/stepresult');
            var step = new StepResult();
            step._name = res.CommandResult.CommandName ? res.CommandResult.CommandName : res.Module.toLowerCase() + '.' + res.Method.toLowerCase();
            step._status = res.CommandResult.IsSuccess == true ? STATUS.PASSED : STATUS.FAILED;
            step._duration = res.CommandResult.Duration;
            // should be string. otherwise XML serialization fails.
            step._action = res.CommandResult.IsAction + "";
            step._transaction = _lastTransactionName;
			step.screenshot = res.CommandResult.Screenshot;
			step.stats = {};
			if (res.CommandResult.LoadEvent)
				step.stats.LoadEvent = res.CommandResult.LoadEvent;
			if (res.CommandResult.DomContentLoadedEvent)
				step.stats.DomContentLoadedEvent = res.CommandResult.DomContentLoadedEvent;
            rs.steps.push(step);
            // check if the command has returned error
            if (res.CommandResult.StatusText != null)
			{
				var Failure = require('../model/stepfailure');
				step.failure = new Failure();
				var message = res.CommandResult.StatusText;
				var throwError = true;
				if (res.CommandResult.StatusData)
					message += ': ' + res.CommandResult.StatusData;
				
				if (res.CommandResult.StatusText !== 'UNKNOWN_ERROR') {
					if (res.CommandResult.StatusText === 'VERIFICATION') 		// ignore verifyXXX commands failure
						throwError = false;
					step.failure._type = res.CommandResult.StatusText;
					step.failure._details = res.CommandResult.StatusData;
				}
				else if (res.CommandResult.ErrorMessage && res.CommandResult.ErrorMessage.length > 0)
				{
					
					var message = step.failure._message = res.CommandResult.ErrorMessage;
					var stacktrace = step.failure._details = res.CommandResult.ErrorDetails;
					step.failure._type = res.CommandResult.ErrorType;
					if (stacktrace) message += stacktrace;
				}
				
				if (throwError)
					throw new Error(message);
			}
        }
    	return res.ReturnValue;
    }
    return module;
};
