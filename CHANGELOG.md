# CHANGELOG

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
