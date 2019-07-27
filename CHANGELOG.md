# CHANGELOG

## v0.47.1 (2019-07-28)
* Internal fixes.

## v0.47.0 (2019-07-26)
* Add `web.dragAndDrop`.
* Internal changes - fix breakpoint processing and make oxygen work with VS Code debugger.
* Bump dependencies.

## v0.46.6 (2019-07-19)
* Improve performance of HTML report generation.
* Bump dependencies.

## v0.46.5 (2019-07-17)
* Add support for adding breakpoints after the test has started.
* Bump dependencies.

## v0.46.4 (2019-07-14)
* Fix invalid breakpoint handling in debugger.

## v0.46.3 (2019-07-10)
* Fix number of issues with HTML reports.

## v0.46.2 (2019-07-09)
* Support external webdriverio options.
* Improve error handling for RuntimeError.

## v0.46.1 (2019-07-03)
* Fix `soap` module to work with HTTPS which uses self-signed certificates.
* Fix `http` module to work with HTTPS which uses self-signed certificates.
* Fix `pdf.assert` not working properly with certain words having spaces in them.

## v0.46.0 (2019-07-02)
* Add `mob.getAppiumLogs`.
* Add `mob.getDeviceLogs`.
* Add `mob.getDeviceTime`.
* Add `mob.setTimeout`.
* Add `web.getBrowserLogs`.
* Add `pdf` module.
* Remove dependency on Mono for Linux & OS X.

## v0.45.2 (2019-06-17)
* Internal fixes.

## v0.45.1 (2019-06-11)
* Move `web.sendKeyboardActions` functionality to `web.sendKeys`.

## v0.45.0 (2019-06-11)
* Add `web.sendKeyboardActions` (on behalf of Alexei Mikheev).
* Fix `mob.swipe` to throw proper error when element not found.
* Fix commands failing with cryptic error when passed null as a locator.
* Bump dependencies.

## v0.44.1 (2019-06-10)
* Fix CSV parameters parsing.
* Fix UNKOWN_ERROR being thrown for assertion errors.

## v0.44.0 (2019-05-29)
* Remove support for using ECMAScript modules from `require`.

## v0.43.0 (2019-05-27)
* Add `web.getTitle`.
* Unwrap the return value returned by `web.execute` and `mob.execute`.
* Internal fixes.

## v0.42.8 (2019-05-05)
* Remove browserName if both browserName and appPackage were specified.
* Override script specified caps for mob tests with context caps.

## v0.42.7 (2019-04-29)
* Fix --ro command line switch.

## v0.42.6 (2019-04-24)
* Better error message on invalid IE zoom level.
* Internal fixes.

## v0.42.4 (2019-04-16)
* Fix date values not being parsed correctly when reading a CSV.
* Bump dependencies

## v0.42.3 (2019-04-02)
* Fix encoding issue when reading CSVs without BOM.
* Bump dependencies

## v0.42.2 (2019-03-13)
* Fix `web.scrollToElement`.

## v0.42.1 (2019-03-12)
* Internal fixes.

## v0.42.0 (2019-02-25)
* Add `shell` module.

## v0.41.2 (2019-02-01)
* Fix possible crash in `web.click`.

## v0.41.1 (2019-01-30)
* Internal fixes.

## v0.41.0 (2019-01-29)
* Add `web.assertTextNotPresent`.
* Add timeout to `web.assertTextPresent`.
* Fix `mob.swipe` when used without locator.
* Generate proper oxygen error on element not found in `mob.waitForExist`.
* Fix documentation.
* Use dependencies only from npm repo.

## v0.40.0 (2019-01-15)
* Add `web.refresh`.
* Handle element not displayed errors from IE driver.
* Produce proper error when browserName is not specified for `web.init`.
* Fix documentation.
* Other internal fixes.

## v0.39.0 (2018-12-28)
* **[Breaking change]** `mob.selectFrame` behavior changed to match `web.selectFrame`.
* Fix documentation.
* Other internal fixes.

## v0.38.0 (2018-12-23)
* Allow to access Oxygen modules and context from external modules.
* Add ES6 support to the test script imported modules.
* Fix commented out parameters being reported as undefined.
* Other internal fixes.

## v0.37.0 (2018-12-20)
* Ignore delay for transaction commands.
* Fix `date.fromNow` documentation.
* Add authentication support for `soap`.

## v0.36.1 (2018-12-17)
* Fix error's line number not saved in step result.

## v0.36.0 (2018-12-11)
* Add `web.back`.
* Fix `mob.isVisible`.
* Better handling of error caused by lack of Mono installation on MacOS, when generating HTML report.

## v0.35.5 (2018-12-01)
* Fix invalid transaction name in reports in certain situations when executing multiple iterations.

## v0.35.4 (2018-11-28)
* User friendly error messages on invalid parameter files.

## v0.35.3 (2018-11-28)
* Don't try to trim non-string parameter values.
* Use js injection click fallback for non-intractable elements.

## v0.35.2 (2018-11-27)
* Remove extra whitespace characters from parameters loaded from xlsx.

## v0.35.1 (2018-11-26)
* Better error message when Android device is not found.
* Fix crash under rare circumstances.

## v0.35.0 (2018-11-23)
* **[Breaking change]** Rename `mob.isDisplayed` to `mob.isVisible`.
* Fix `mob.is*` behavior when element not found.
* Better error messages for Selenium and Appium init failures.
* Better error messages on text mismatch for `web.waitForText` and `web.waitForValue`.
* Fix test time being reported in utc instead of local time in reports.
* Documentation updates.

## v0.34.4 (2018-11-19)
* Fix debugger.

## v0.34.2 (2018-11-12)
* Bump dependencies (adds support Node 9 and 10)

## v0.34.1 (2018-11-06)
* Fix invalid error being reported under certain conditions.

## v0.34.0 (2018-11-06)
* Add `db.executeQuery`.
* Fix crash on Linux/OSX if odbc binaries are not installed.
* Fix incorrect error type returned in certain situations.
* Fix error line number not shown for certain errors.
* Bump webdriverio.

## v0.33.0 (2018-10-24)
* **[Breaking change]** Rename `web.waitForElementPresent` to `web.waitForExist`.
* **[Breaking change]** Rename `web.isElementPresent` to `web.isExist`.
* **[Breaking change]** Rename `web.isElementVisible` to `web.isVisible`.
* **[Breaking change]** Rename `web.assertElementPresent` to `web.assertExist`.
* **[Breaking change]** Rename `web.executeScript` to `web.execute`.
* **[Breaking change]** Rename `web.getPageSource` to `web.getSource`.
* **[Breaking change]** Rename `mob.waitForElement` to `mob.waitForExist`.
* **[Breaking change]** Rename `mob.setValue` to `mob.type`.
* **[Breaking change]** Remove empty string locator from `web.selectWindow`.
* **[Breaking change]** Change `web.selectFrame` behavior:
    * Multiple locators can be passed as arguments now instead of separating the frame XPathes with
    `';;'`
    * `"relative=parent"` changed to "parent"
    * `"relative=top"` changed to  "top"
    * `"index=x"` changed to x (passed as a number)
* **[Breaking change]** Add `mob.setAutoWait`.
* Add `web.setAutoWait`.
* Add X offset support in `web.scrollToElement`.
* Improved error handling for situations when invalid arguments are passed to methods.
* Fix documentation.
* Error code names changes:
    * ASSERT -> ASSERT_ERROR
    * VERIFY -> VERIFY_ERROR
    * NO_SUCH_ELEMENT -> ELEMENT_NOT_FOUND
    * NO_SUCH_FRAME -> FRAME_NOT_FOUND
    * UNKNOWN_COMMAND -> UNKNOWN_COMMAND_ERROR
    * NO_SUCH_WINDOW -> WINDOW_NOT_FOUND
    * APPIUM_SERVER_UNREACHABLE -> APPIUM_UNREACHABLE_ERROR
    * SELENIUM_SERVER_UNREACHABLE SELENIUM_UNREACHABLE_ERROR
    * NOT_IMPLEMENTED -> NOT_IMPLEMENTED_ERROR
    * DB_CONNECTION -> DB_CONNECTION_ERROR
    * DB_QUERY -> DB_QUERY_ERROR
    * SOAP -> SOAP_ERROR
* Do not try to invoke web.clickHidden from web.click when element not found.
* Fix hang when calling method on a uninitialized module.
* Fix hidden click fallback in `web.click`.
* Fix `web.type` not clearing the previous value.
* `web.selectWindow` will automatically wait for window to appear when using `title` locator.
* Add optional `notOlderThan` argument to `twilio.getLastSms`.
* Fixed `transaction` not working if specified before `init`.

## v0.32.0 (2018-08-09)
* Fix `web.isAlertPresent`.
* Add `mob.clickMultipleTimes`.
* Fix int handling in `assert.equal`
* Perform Javascript injection click if regular click fails in `web.click`
* Reimplemented `mob.clickLong` using a different method to support iOS 11.4.
* Fix bug with skipping second record in CSV file.
* Add `http.getResponseHeaders`.
* Fix hang in `twilio.getLastSms`.
* Add support for script arguments in `web.executeScript`.
* Improve logging.
* Drop `verify` module.
* Bump dependencies.

## v0.31.1 (2018-06-01)
* Fix `mob.getCaps` for suites.
* Bump default swipe speed for `mob.swipe` to 30.
* Fix `mob.execute`.
* Fix `email` module to read last email instead of the first.
* Bump dependencies.

## v0.31.0 (2018-05-16)
* Add `web.getUrl` command.
* Change `web.assertText` and `web.assertValue` commands behavior to pass text or value assertions of hidden elements.

## v0.30.2 (2018-05-16)
* Revised handling of 'require' calls from Oxygen script.

## v0.30.1 (2018-05-16)
* Various `twilio` module fixes.
* Various `email` module fixes.

## v0.30.0 (2018-05-15)
* Add support for referencing global node modules with `require`.
* Add `require.allow` option to control if `require` usage is allowed within the script.
* Add `opt.autoReport` flag to test script - allow to turn on/off auto-reporting steps.
* Add preliminary implementation of `twilio` module.
* Add preliminary implementation of `email` module.

## v0.29.0 (2018-04-22)
* Add `mob.getValue`.
* Fix `mob.getText`.
* Allow to use `require` with global modules inside test scripts.
* Use window size instead of viewport in `web.setWindowSize`
* Add `customStep` method.
* Add support for `continueOnError` option.
* Fix `mob` module re-initialization when `reopenSession` is specified. 

## v0.28.0 (2018-03-16)
* Add --delay switch for delaying command execution.
* Add `web.waitForNotExist`.
* Throw NO_SUCH_ELEMENT from `web.waitForVisible` if element doesn't exist.
* Deprecate `web.waitForElementPresent`.
* Throw LOCATOR_MATCHES_MULTIPLE_ELEMENTS from `web.gettAttribute` and `web.getText` if the locator matches multiple elements.
* Add `mob.selectFrame`.
* Fix context and init method capabilities merging.
* Bump dependencies.

## v0.27.0 (2018-02-27)
* Add `mob.clickLong`.
* Don't check for element visibility in `web.select`.

## v0.26.1 (2018-02-14)
* Fix parameters reading.

## v0.26.0 (2018-02-08)
* Add `mob.enableNetwork`.
* Fix `mob.swipe` and `mob.dragAndDrop` docs.
* Bump dependencies.

## v0.25.0 (2018-01-21)
* Remove '-m' switch.
* Add support for accessibility id locators on Android.
* [Breaking change] Use ~ for accessibility id locators on iOS instead of "id=" prefix.
* Make driver instance accessible from user level scripts.
* Add support for external debuggers.

## v0.24.1 (2017-12-25)
* Emit iteration-end event.

## v0.24.0 (2017-12-25)
* Add `mob.alertAccept`.
* Fix accessibility id locator strategy for native iOS applications.
* Documentation fixes.

## v0.23.0 (2017-12-16)
* [Breaking change] Require explicit web module initialization with `web.init`.
* Add `mob.unlockPattern`.
* A more reliable `web.waitFor*` implementation.
* Add preliminary support for JUnit reports.
* Fix suites execution stopping on the first fatal error.
* Fix status code handling in `http` module.
* Add support for native android id locators without package prefix.
* Trim and collapse white space for `web.getAttribute`, `getCssValue`, `getText` return values.
* Collapse whitespace in patterns.
* Add preliminary `date` module implementation.
* webdriverio@4.9.9

## v0.22.0 (2017-11-11)
* Fix time formatting in reports.
* Fix reliability issues with `web.waitForWindow`.
* Add `mob.smsClickLink`.
* Change `mob.getSmsText` to `mob.smsGetText`.

## v0.21.0 (2017-10-30)
* Add `serial.write` and `serial.getBuffer`.
* `mob.getSmsText` now uses android-smspopup application (see documentation) instead of SMSPopup from Play Store and accepts optional `wait` argument.
* Add `mob.isExist`.
* Fix regex pattern matching not performing the matching globally.

## v0.20.0 (2017-10-23)
* Fixed certain errors being ignored.
* Add `serial` module.
* Add `http` module.
* Add `mob.getLcoation`
* Fixed empty pattern matching in `web` module.
* Fixed `web.selectWindow` and `web.waitForWindow` failing if there is no currently active window.
* Fixed `name` locator handling in `web` module.

## v0.19.6 (2017-10-17)
* Return attribute only for the first matching element in web.getAttribute.
* Fix glob pattern matching in multi line text.

## v0.19.5 (2017-10-16)
* Return boolean instead of string from mob.is* commands.

## v0.19.4 (2017-10-15)
* Fix mob.scrollIntoElement

## v0.19.2 (2017-10-12)
* Use local time instead of UTC in reports.

## v0.19.0 (2017-10-11)
* Add mob.isCheckable, mob.isChecked, mob.isClickable, mob.isSelected
* mob.scroll command renamed to mob.dragAndDrop
* Fix web.type failing if passed value is not a string.
* Fix handling of parameters with underscore in the name.
* Update dependencies.

## v0.18.2 (2017-10-01)
* Fix error types generated on waitForExist and and waitForVisible.

## v0.18.0 (2017-09-29)
* `web`, `soap`, and `db` modules, previously implemented in C#, have been reimplemented in Node.js. This provides a number of significant benefits - faster test initialization, removes the need for version matching between Oxygen and Selenium servers, solves a number of issues on Linux/OS X related to Mono version incompatibility, allows using `soap` and `db` along with the `mob` module, and provides more flexibility in module's development.

  Note that .NET/Mono is still required if you wish to generate HTML or PDF reports.  
  In addition, `db` module now requires `unixODBC` libraries to be installed. See README. If `unixODBC` is not available the module won't be installed.

  Module specific changes are as follows:

  __`soap`__  
  *Removed*  
  `get12` - Removed in favor of the new `soap.get` method.  
  *Changed*  
  `get` - Signature changed to accept WSDL URL, method name, and any complex objects as service arguments. Unlike prior implementation this method will return object instead of a JSON serialization.  
  *Added*  
  `describe`

  __`web`__  
  *Removed*  
  `setBaseUrl`, `quit`, `getXMLPageSourceAsJSON`  
  *Changed*  
  [`waitForWindow`, `waitForValue`, `waitForText`, `waitForNotValuec`, `waitForNotValue`, `waitForElementPresent`, 
             `assertValue`, `assertElementPresent`, `assertAlert`, `assertSelectedValue`, `assertSelectedLabel`] - Now accept timeout as and optional argument.  
  `type` - Support for `${KEY_}` key codes has been removed in favor of Unicode characters.  
  `point` - Accepts two optional arguments xoffset and yoffset.  
  `getWindowHandles` - Return type changed to String[].  
  `getElementCount` - Accepts any of supported locators in addition to XPath.  
  `getElementCount` - Return type changed to Object.

  __`eyes`__  
  Temporary removed pending rewrite.
   
   
* Updated dependencies.

## v0.17.0 (2017-09-17)
* Fix iteration collapsing not working in HTML reports when having more than one iteration.
* Improve HTML reports.
* Add PDF reporter (--rf=pdf switch).
* Fix oxygen bin not launching on OSX and Linux.
* Fix random parameters mode.

## v0.16.0 (2017-09-02)
* Add web.getCssValue command.

## v0.15.0 (2017-08-21)
* Add mob.tap command.

## v0.14.1 (2017-08-14)
* Make log.* commands generate proper output in html reports.
* Remove log.fatal command.

## v0.14.0 (2017-08-05)
* Additional mobile locators: desc-contains, text-contains, scrollable, link-contains.
* Fix not being able to use transactions when running web tests with multiple iterations.
* Add ability to run mobile tests against remote hubs.

## v0.13.3 (2017-07-31)
* Fix number of issues with Excel reports generation.
* Fix report generation when --pm=all option is used.
* Don't generate unnecessary XML report when using the --rf=html option.

## v0.13.2 (2017-07-28)
* Fix global installation.

## v0.13.1 (2017-07-28)
* Initial release published to npm registry.
