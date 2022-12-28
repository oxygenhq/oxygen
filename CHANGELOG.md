# CHANGELOG

## v1.26.0 (2022-12-28)

#### :tada: New Feature
* Add `Add web.network.blockUrls`.
* Add `ox.addAttribute` function for adding custom test attributes to the test result.

## v1.25.0 (2022-12-22)

#### :beetle: Bug Fix
* Scripts with deeply nested `init` methods failed to execute in some situations when part of a Suite.

## v1.24.9 (2022-12-09)

#### :house: Internal
* Downgrade mailparser to support node 12.

## v1.24.8 (2022-12-09)

#### :beetle: Bug Fix
* Session not being dispossed for web tests.

#### :house: Internal
* Bump dependencies.

## v1.24.7 (2022-12-08)

#### :beetle: Bug Fix
* Fix assertions not working in `http` module for non 2xx/3xx return codes.
* Fix `soap` module not working.
* Throw `APPIUM_SESSION_TIMEOUT` instead of `SELENIUM_SESSION_TIMEOUT` for mobile tests.

#### :house: Internal
* Bump dependencies.

## v1.24.6 (2022-11-04)

#### :house: Internal
* Bump dependencies.

## v1.24.5 (2022-09-22)

#### :house: Internal
* Bump dependencies.

## v1.24.4 (2022-08-24)

#### :beetle: Bug Fix
* Fix value parsing in `web.waitFor*` commands (by Francois Wauquier).
* Fix issue with Applitools when API key is passed via "init" method.

#### :house: Internal
* Expose oxygen internal variables to debugger.
* Bump dependencies.

## v1.24.3 (2022-08-12)

#### :beetle: Bug Fix
* Additional fixes for MODULE_NOT_INITIALIZED error when running multiple tests which reference an external script containing `*.init` commands.
* Do not include browserName when bundleId is specified in mobile capabilities.

## v1.24.2 (2022-08-05)

#### :tada: New Feature
* Add `web.isInteractable`.

#### :beetle: Bug Fix
* Fixed MODULE_NOT_INITIALIZED error when running multiple tests which reference an external script containing `*.init` commands.

#### :house: Internal
* Bump dependencies.

## v1.24.1 (2022-07-29)

#### :beetle: Bug Fix
* Closing bracket indentation in `log.*` output.
* Handing of objects with circular references in `log.*` commands.
* `web.assertTextPresent` and  `web.assertTextNotPresent` not properly restoring timeouts on exit.

#### :house: Internal
* Bump dependencies.

## v1.24.0 (2022-07-19)

#### :tada: New Feature
* Add `twilio.getLastSentApiSms` (by Akiva Brookler).

#### :house: Internal
* Bump dependencies.

## v1.23.2 (2022-06-17)

#### :beetle: Bug Fix
* Fix test execution on Perfecto Mobile.

## v1.23.0 (2022-06-15)

#### :tada: New Feature
* Add `db.callProcedure`.

#### :beetle: Bug Fix
* Fix test execution on Firefox.
* `http`: fix issue with "Cannot read property 'includes' of undefined" error when content-type header is missing in the response.

#### :house: Internal
* Bump dependencies.

## v1.22.1 (2022-04-28)

#### :beetle: Bug Fix
* Fix test execution on Firefox.
* Convert body to object in http.get when nessasry. 
* Catch and ignore device logs retrieval issue, if cloud provider doesn't support this operation.

## v1.22.0 (2022-01-14)

#### :tada: New Feature
* Add `utils.xmlToJson`.

#### :beetle: Bug Fix
* Invalid line number printed for certain errors.
* Number of issues with BrowserStack integration.
* Number of issues with `shell` module.

#### :nail_care: Polish
* Documentation improvements.
* Increase `http` module's default response timeout from 30 to 60 seconds.

#### :house: Internal
* Bump dependencies.

## v1.21.0 (2022-01-17)

#### :boom: Breaking Change
* Previously deprecated `web.selectWindow` with no arguments has been removed.

#### :tada: New Feature
* `email` module: add support for base64 encoded body and option to download email attachments.
* Add `utils.dnsResolve`.
* Add `utils.readXlsx`.
* Add `web.maximizeWindow`, `web.minimizeWindow`, `web.fullscreenWindow`.
* Add `soap.getLastResponseHeaders`.
* `soap.get`: allow passing HTTP request headers.

#### :beetle: Bug Fix
* Fix `mob.sendKeys` argument validation.
* `web.setTimeout` not having any effect on `web.open`.
* `web.waitForNotExist` not working as expected.
* Fix memory leak in `db` module.
* `assert.equal` not working correctly when input strings consisted of digits.

#### :nail_care: Polish
* Documentation improvements.

#### :house: Internal
* Refactor everything for more asynchronicity.
* Use `got` instead of the no longer supported `request` for `http` module.
* Bump other dependencies.

## v1.20.2 (2021-09-05)

#### :beetle: Bug Fix
* Fix key usage in `utils.encrypt`.

## v1.20.1 (2021-08-06)

#### :beetle: Bug Fix
* Issue with test execution on Perfecto Mobile.

#### :nail_care: Polish
* Improve error handling in `utils.decrypt`.

## v1.20.0 (2021-08-04)

#### :boom: Breaking Change
* `web.isChecked` has been deprecated and will be removed in future versions. Use `web.isSelected` instead.

#### :tada: New Feature
* Support for NodeJS 14.
* Added `utils.readCsv` and `utils.writeCsv`.
* Allow filtering by source number in `twilio.getLastSms`.
* Added `utils.encrypt` and `utils.decrypt`.
* Added `web.waitForAngular` and `web.setAutoWaitForAngular`.
* Added `mob.selectWindow`, `mob.select`.
* Added `http.patch`.

#### :beetle: Bug Fix
* `web.isSelected` not working in certain situations.
* Index repeating transactions to prevent duplicate transaction names in results.
* Failure taking mobile screenshots in certain situations.

#### :nail_care: Polish
* Documentation improvements.
* Notify when `mob` command is being used in wrong mobile context.
* Improve error handling in `http` module.

#### :house: Internal
* Upgrade to WDIO v7 and bump other dependencies.

## v1.19.1 (2021-06-01)

#### :beetle: Bug Fix
* `http` and `utils` module not working when using multiple iteration.

#### :nail_care: Polish
* Do not invoke module disposal mechanism on dead sessions (which previously led to test finalization taking a few minutes in certain situations).
* Miscellaneous internal cleanups.

## v1.19.0 (2021-05-25)

#### :boom: Breaking Change
* `http` module will no longer throw on erroneous HTTP status codes, and will return the request/response details instead.

#### :tada: New Feature
* Add `web.network.waitForNotUrl`.
* Return `responseBody` and `requestPostData` in requests recorded with `web.network`.
* Add `web.newWindow`.

#### :beetle: Bug Fix
* PDF and XML reporter not working.
* `pdf.count` ignoring strings which appear multiple times on the same line.
* Ignore "ignored" steps in Cucumber.
* Make status argument in `web.dispose` and `mob.dispose` optional.
* Issue with converting Chai assertions to Oxygen errors.
* Various other fixes.

#### :nail_care: Polish
* Better error handling in debugger.
* Better error handling when parsing JSON/CSV/XLSX parameter files.
* Process "invalid selector" errors.
* Improved duration formatting in test reports.
* Add validation for timeout arguments and notify the user in case of invalid values.
* Removed redundant module disposal.

#### :house: Internal
* Bump dependencies.
* Support for REPL.

## v1.18.0 (2021-03-24)

#### :tada: New Feature
* Add `utils.pause`.

#### :beetle: Bug Fix
* `web.click`, `web.rightClick`, `web.doubleClick` not working on IE < 11.

#### :nail_care: Polish
* Print more details on `http` module failures.
* Documentation updates.

## v1.17.0 (2021-03-22)

#### :boom: Breaking Change
* `http` module has been rewritten to support more features. As a result some methods, their arguments, and return types were substantially changed. See API documentation for more details.

#### :tada: New Feature
* Add `soap.setProxy`.
* Add `autoDispose` setting to `oxygen.conf` to control whether to dispose modules automatically between test iterations.

#### :beetle: Bug Fix
* `web.click` and `web.clickHidden` not working on IE < 11.
* `web.fileBrowse` not working.
* Issue with hooks in Cucumber tests.
* Various other fixes.

#### :nail_care: Polish
* Process "element not interactable" errors.

#### :house: Internal
* Bump dependencies.

## v1.16.1 (2021-02-15)

#### :beetle: Bug Fix
* Issue with module disposal.

## v1.16.0 (2021-02-09)

#### :tada: New Feature
* New command `mob.longPressKeyCode`.
* New command `web.rightClickActions`
* Node module `proxy`.

#### :beetle: Bug Fix
* Error parsing in `db` module.
* Number of issues with session disposal.

## v1.15.0 (2021-01-16)

#### :tada: New Feature
* Added `*.waitForInteractable`.

#### :beetle: Bug Fix
* `web.switchToWindow` crashes when one of the windows closes mid-way.
* `web.switchToWindow` crashing in certain situations.
* Memory leak during test disposal.
* Various issues with `mob.scrollIntoElement`, `mob.swipe`, `mob.swipeElement`, `mob.swipeScreen`.
* Script errors not being processed.
* Handling of missing locator arguments in `mob` module.

#### :house: Internal
* Pass console output from child process to external libraries.
* Number of internal fixes.
* Bump dependencies.

## v1.14.3 (2020-11-27)

#### :beetle: Bug Fix
* Fix ChromeDriver cleanup on Linux.

#### :house: Internal
* Bump dependencies.

## v1.14.2 (2020-11-20)

#### :beetle: Bug Fix
* Regression in `web.clickHidden`.
* Invalid filename printed in error details for certain errors.

## v1.14.1 (2020-11-16)

#### :tada: New Feature
* Automatic retry on `STALE_ELEMENT_REFERENCE`.

#### :beetle: Bug Fix
* Fixed `*.findElements` to throw errors instead of returning an empty array for anything else except `ELEMENT_NOT_FOUND`.

#### :nail_care: Polish
* Process "module not found" errors.
* Process "window not found" errors.
* Process "The element with selector * you trying to pass into the execute method wasn't found" errors.

## v1.14.0 (2020-11-08)

#### :boom: Breaking Change
* `*.findElements` will return an empty array instead of failing when no elements are found.

#### :beetle: Bug Fix
* `win.selectWindow` not working with `title=` prefix.
* Test name not being set for tests executed on PerfectoMobile provider.

## v1.13.7 (2020-11-03)

#### :beetle: Bug Fix
* Fixed issue with stopping `mob` and `win` tests.
* Fixed issue with re-running failed tests.

#### :house: Internal
* Bump dependencies.

## v1.13.6 (2020-10-27)

#### :beetle: Bug Fix
* `onBeforeCase` and `onAfterCase` support in Cucumber tests.
* Fixed number of issues with Edge when using cloud providers.

#### :house: Internal
* Collect logs and HAR for Cucumber tests.

## v1.13.5 (2020-10-19)

#### :beetle: Bug Fix
* Fixed `web.sendKeys` throwing an error if currently active window is closed during the command execution.
* Fixed `web.click` and `web.clickHidden` to work in IE < 9 compatibility mode.
* RegExp arguments not properly displayed in reports.

#### :house: Internal
* Bump dependencies.

## v1.13.4 (2020-10-13)

#### :beetle: Bug Fix
* Fixed maximum call stack size exceeded issue (#102).

## v1.13.3 (2020-10-12)

#### :beetle: Bug Fix
* Add option to enable SNI in `email` module. This fixes issue with connection to Gmail.

## v1.13.2 (2020-10-08)

#### :house: Internal
* Fixed parameter handling when using re-run option.

## v1.13.1 (2020-10-08)

#### :house: Internal
* Added internal option for disabling screenshots on failure.

## v1.13.0 (2020-10-08)

#### :tada: New Feature
* Support for `beforeCommand` and `afterCommand` hooks.

#### :boom: Breaking Change
* `web.dispose` and `mob.dispose` now expects a mandatory status argument.

#### :beetle: Bug Fix
* `web.waitForVisible` was ignoring the timeout argument.

#### :nail_care: Polish
* Made CSV parsing errors more user friendly.
* Print more detailed failure information for Cucumber tests.

#### :house: Internal
* Added BrowserStack integration.
* Fixed issue with SauceLab session disposal.
* Fixed domContentLoadedEvent and loadEvent calculation.
* Added internal option to re-run failed tests.
* Updated WDIO to v6.6.0.

## v1.12.0 (2020-09-27)

#### :boom: Breaking Change
* Execute each Case using new browser session when executing Suites.

#### :beetle: Bug Fix
* Test initialization on Edge + BrowserStack.
* `web.getXMLPageSource` to work on Edge.

#### :nail_care: Polish
* Fail silently if click fails due to js injection error.
* Fallback to js click when ChromeDriver fails due to element being located in Shadow DOM.

#### :house: Internal
* Fixed an issue with performance timings not being recorded.

## v1.11.0 (2020-09-21)

#### :tada: New Feature
* Add `mob.assertAlert`.
* Add `mob.getBrowserLogs`.

#### :beetle: Bug Fix
* `timeout` argument being ignored in some commands.
* Number of issues in `alert` related commands.

#### :book: Documentation
* Add missing accessibility id locator to win docs.

#### :nail_care: Polish
* Make CSV parsing errors more user-friendly.
* Increase default 3000ms `waitFor*` timeout to 5000ms.
* Produce proper error if `web.pointJS` is not supported on IE.
* Throw a more detailed error when `web.clickHidden` is not supported on IE.

#### :house: Internal
* Fix performance stats not being fetched correctly.
* Fix logs retrieval.
* Code refactoring.
* Bump dependencies.

## v1.10.0 (2020-09-13)

#### :boom: Breaking Change
* Minimal supported node.js version 10.18.1.

#### :beetle: Bug Fix
* No error details shown for oxygen.po/conf/env.js errors.
* Filename not shown for certain script errors.
* Issue with `*.network` module re-initialization.

#### :nail_care: Polish
* Make transaction's duration an aggregate of all the underlying command durations.

## v1.9.0 (2020-09-09)

#### :boom: Breaking Change
* `soap.describe` returns object instead of a serialized representation.

#### :tada: New Feature
* Add `web.isChecked`.

#### :beetle: Bug Fix
* `web.getHtml` wasn't available.
* Execution on MicrosoftEdge.
* width and height wasn't adjusted properly in `web.makeVisible`.
* Memory leak when using multiple iterations.
* Shared `vars` object for passing data between tests not working.

#### :nail_care: Polish
* Add error handling for network errors on Chrome 85.

#### :house: Internal
* Fixed breakpoints not working with UNC paths.
* Fixed mobile logs not being collected.

## v1.8.2 (2020-08-30)

#### :house: Internal
* Downgrade WDIO due to a regression.

## v1.8.1 (2020-08-30)

#### :house: Internal
* Simplify debugger's path to url conversion.
* Do not close browser on failed tests (when running through IDE).
* Bump dependencies.

## v1.8.0 (2020-08-25)

#### :tada: New Feature
* Add `web.getHTML`.

#### :nail_care: Polish
* Throw proper error on `mob.click` in webview context if element is not interactable.

#### :house: Internal
* Fix filename handling in debugger.
* Bump WDIO to v6.4.2.

## v1.7.2 (2020-08-23)

#### :beetle: Bug Fix
* `ID` locators not working in `win` module.
* `web.click` working in asynchronous mode instead of synchronous.

#### :book: Documentation
* Fixed `win`, `web`, and `mob` modules formatting.

#### :house: Internal
* Bump and cleanup dependencies.

## v1.7.1 (2020-08-22)

#### :beetle: Bug Fix
* Regression with `services` and `modules` settings in `oxygen.conf` being ignored.

## v1.7.0 (2020-08-20)

#### :tada: New Feature
* Support for BrowserStack provider.
* Take screenshots for all available windows including the titles on errors.
* Improved performance during test initialization.

#### :beetle: Bug Fix
* Fixed `web.makeVisible` to work with elements with 0 height/width and `!important` style applied.
* `web.assertTextPresent` and `web.assertTextNotPresent` not producing proper errors.
* Invalid oxygen.conf/po/env.js files not being handled properly.
* Fixed npm updates check during `npm root -g` invocation not being disabled.
* Produce proper errors when `web.network` is not initialized.
* Fix tests getting stuck sometimes on low level WDIO errors.
* `require` not working from within `oxygen.conf/po/env.js` files.

#### :nail_care: Polish
* Improved reports generated by cli to specify browser/device name next to suite details.
* Handle additional WebDriver errors.

#### :book: Documentation
* `email` module fixes.

#### :house: Internal
* Fixed number of issues with results, environments, and breakpoints processing.
* WebDriverIO updated to v6.4.0.
* Bump dependencies.

## v1.6.1 (2020-07-03)

#### :beetle: Bug Fix
* Fix npm root -g mechanizm for macos

## v1.6.0 (2020-06-25)

#### :tada: New Feature
* Support for Node.js 12.
* `web.getWindowSize` for returning browser window dimensions.
* `assert.pass` for arbitrary stopping test execution.

#### :beetle: Bug Fix
* Browser session not being disposed in some cases.
* `web.assertTextPresent` and `web.assertTextNotPresent` not working correctly.
* `web.point` not working correctly.
* `win.isSelected` not working correctly.
* Environment definition not being read from oxygen.conf.js.
* Exit code returned by Oxygen not reflecting the test status.

#### :nail_care: Polish
* `mob.swipeElement` no longer requires `speed` argument.
* Improved `mob.swipe` behavior.
* Improved `web.assertSelectedLabel` and `web.assertSelectedValue` to accept optional argument specifying whether to wait for element's visibility.
* `web.getText` no longer requires element to be visible.

#### :book: Documentation
* Various documentation fixes.

## v1.5.1 (2020-06-17)

#### :beetle: Bug Fix
* Regression related to execution of Cucumber projects.
* Regression related to execution of single test scripts.

#### :nail_care: Polish
* Improve command argument serialization.

## v1.5.0 (2020-06-15)

#### :tada: New Feature
* Added support for defining suites in separate files.

#### :beetle: Bug Fix
* Re-enabled `network` module.

## v1.4.1 (2020-06-09)

#### :tada: New Feature
* Added support for finding windows by their URL to `web.selectWindow` and `web.waitForWindow`. 
Option to select/waitFor last opened windows has been deprecated and will be removed in the future.

#### :beetle: Bug Fix
* `mob.swipeElement` not working due to a typo.

#### :book: Documentation
* Various documentation fixes.

#### :house: Internal
*  WebDriverIO updated to v5.23.0.

## v1.4.0 (2020-06-07)

#### :tada: New Feature
* `mob.getTitle`
* `mob.getUrl`

#### :beetle: Bug Fix
* `web.type` on Firefox not triggering some events attached to the element.
* Browser not being closed on test completion when multiple tabs or windows are opened.
* `web.pointJS` not working on Internet Explorer.
* Incorrect command duration in HTML reports.

#### :nail_care: Polish
* Improve `web.makeVisible` to adjust visibility of parent elements as well.
* Handle 'Element not clickable at point' errors produced by IE.
* Handle 'element click intercepted' errors.
* Handle 'No active session with ID' errors.

#### :book: Documentation
* Improve documentation for `web.scrollIntoView`, `mob.getAlertText`, `*.getDriver`.

#### :house: Internal
* Initial support for PerfectoMobile provider.
* Increase `connectionRetryTimeout` and decrease `connectionRetryCount` in order to better handle slowly loading pages.
* Bump dependencies.

## v1.3.0 (2020-05-10)

#### :tada: New Feature
* Add `assert.contain`.

#### :beetle: Bug Fix
* Log entries generated by Cucumber runner.
* Missing "location" in some thrown errors.

## v1.2.5 (2020-05-04)

#### :beetle: Bug Fix
* Number of issues to related to module initialization.
* Cucumber runner not populating logs data.

## v1.2.0 (2020-04-13)

#### :tada: New Feature
* Add `web.pointJS`.

#### :beetle: Bug Fix
* `--p=json` switch not working.
* Number of issues related to running tests on LambdaTest cloud provider.
* Relative paths in `pdf.assertNot` and `pdf.count`.

#### :nail_care: Polish
* Argument validation for `*.type` and `*.open` commands.
* Process 'Failed to create session' errors.

#### :book: Documentation
* Fix `web.deleteCookies` documentation.

#### :house: Internal
* WebDriverIO updated to v5.22.1.
* Improvements to browser disposal, debugger support, and SauceLabs provider support.

## v1.1.3 (2020-03-15)

#### :beetle: Bug Fix
* Debug logs were not added to JSON results.

#### :nail_care: Polish
* Properly process 'invalid url' errors.

#### :house: Internal
* Update dependencies.

## v1.1.2 (2020-03-06)

#### :house: Internal
* Fix process disposal.

## v1.1.1 (2020-02-29)

#### :nail_care: Polish
* Properly process 'invalid css selector' errors.

#### :house: Internal
* Remove duplicate dependency.

## v1.1.0 (2020-02-27)

#### :boom: Breaking Change
* `log.*` will automatically serialize the value if it's a complex object. Using `log.info(JSON.stringify(obj))` is no longer required.
* Minimum required version of Node.js has been raised to v10.14. Although Oxygen will work in part on older versions, anything below 10.14 is no longer officially supported.

#### :beetle: Bug Fix
* `log.*` not working with non-string objects.
* Parameters not loaded correctly from CSV if header contains spaces.
* Error handling in `web.assertAlert`, `web.alertAccept`, `web.alertDismiss` commands.
* Processing of ChomeDriver version mismatch errors.
* Generate HTML reports by default even if `--rf` switch is not specified.
* Regression with `assert` commands no longer taking screenshot for web and mobile tests.

#### :house: Internal
* Update dependencies.
* Various other small fixes & improvements.

## v1.0.3 (2020-02-13)

#### :beetle: Bug Fix
* Stopping test not working reliably.
* Loading custom globally installed modules not working with `require`.
* Confusing error message when required file is not found.

## v1.0.2 (2020-02-12)

#### :beetle: Bug Fix
* `--server` switch not working with mobile tests.
* `--ro` switch not working.
* `id` locator in web tests not working if it contains illegal characters.
* Test doesn't run if empty parameters file is used.

#### :nail_care: Polish
* Update help screen.
* Properly process 'Specified URL is not valid' errors.
* Properly process 'invalid xpath' errors for IE.

#### :house: Internal
* Update dependencies.

## v1.0.1 (2020-02-05)

#### :house: Internal
* Various fixes.

## v1.0.0 (2020-02-04)

#### :tada: New Feature
* Significant improvements to test structure organization, allowing to define all configurations using a project file.
* Improvements to the script development flexibility:  
  - Automation tests can be written using ES6.
  - Tests can hook into exposed `before` and `after` hooks for `test`, `suite`, `case`, `command` actions.
* Improvements to Oxygen extendability:  
  - Internal modules can be written using ES6 and can be developed in both synchronous and asynchronous (using `async/await` operators) manner.  
  - Modules can contain submodules. E.g. `web.network.assertUrl`.
  - Added support for Service. Services are add-ons which can be developed for providing additional custom logic for tests.
* Support for Applitools for visual UI testing.
* Support for native Windows applications (via WinApiDriver) automation - WinForms, WPF, UWP, Classic Win32.
* Support for writing tests using Cucumber.
* Support for environment variables.
* Project level Page Object support.
* Support for running multiple Suites as a part of a single test.
* Improved debugging support when using breakpoints in external files.
* Added `web.rightClick`.
* Added `win.rightClick`.
* Improvements to SauceLabs, LambdaTest, TestingBot integrations
* `pdf` methods accept optional argument for reversing string order (useful when working with RTL languages).

#### :boom: Breaking Change
* `ox.*` is no longer available. `ox.modules.*` should be used instead. All available modules `web`, `mob`, etc are also exposed globally now and can be used directly.
* `return` is no longer supported for terminating user scripts.
* Suite configuration JSONs are no longer supported. Project level configuration files should be used instead.
* `web.network*` commands are now accessible via a submodule `web.network.*` and have different names. See documentation for more details.
* Oxygen will not produce any reports by default unless `--rf` switch is used.

#### :beetle: Bug Fix
* `twilio` not producing proper error when no matching messages found.
* `web.network` not recording responses for redirected requests.
* `web.click` not working on IE under certain conditions.
* Debugger not entering into module code if module name is specified using wrong case.

#### :nail_care: Polish
* Improved error handling. Errors now contain proper stacktraces and provide more details about where in user script the error has occurred.
* More errors from underlying frameworks are handled and processed.
* JUnit XML reports improved to include more details about test failures.
* `twilio` module performance improvements.
* Added JS injection fall-back for `web.doubleClick` when element is not clickable.

#### :book: Documentation
* Documentation has been migrated to a new infrastructure providing better user experience. Documentation has been, as well, improved with more topics.

#### :house: Internal
* Webdriverio updated to v5.18.6.
* Updated pre-bundled Chrome drivers.

## v1.0.0-beta.14 (2019-12-16)

#### :tada: New Feature
* Take screenshots on `assert.*` command failures.

## v1.0.0-beta.13 (2019-12-15)

#### :beetle: Bug Fix
* Generate proper results on child process crashes.

## v1.0.0-beta.12 (2019-12-15)

#### :tada: New Feature
* Automatically set web context for mobile web tests.

#### :house: Internal
* Improve debugger initialization.

## v1.0.0-beta.8 (2019-12-09)

#### :house: Internal
* Disable devtools-service logging

## v1.0.0-beta.7 (2019-12-08)

**Due a mishap which happened when publishing new version, version number has been increased to 1.0.0-beta.x.  
This version number change doesn't reflect any actual changes in the stable branch of oxygen-cli.  
Version numbers will normalize once the real 1.0.0 is released.**

#### :nail_care: Polish
* Handle "Unable to create new service" init error.

#### :house: Internal
* WebdriverIO@5.16.13.

## v0.52.3 (2019-11-26)

#### :house: Internal
* Remove erroneously published folder.

## v0.52.2 (2019-11-26)

#### :nail_care: Polish
* Handle "Failed to create session" init error in web tests.

## v0.52.1 (2019-11-26)

#### :beetle: Bug Fix
* Fix timeout argument being ignored in `web.network*`.
* Fix failures in certain commands (regression from v0.52.0).

#### :nail_care: Polish
* Handle "Failed to create session" init error.

#### :house: Internal
* WebdriverIO@5.16.9.

## v0.52.0 (2019-11-20)

#### :tada: New Feature
* Add `web.network*` commands for working with network requests in Chrome.

#### :beetle: Bug Fix
* Fix `mob.sendKeys` to work with W3C drivers.

#### :nail_care: Polish
* Process 'invalid selector' errors.

#### :book: Documentation
* Fix `mob.swipeScreen` documentation.

#### :house: Internal
* WebdriverIO@5.16.7
* Bump dependencies.

## v0.51.2 (2019-11-13)

#### :nail_care: Polish
* Try scrolling the element into viewport before clicking it.

#### :house: Internal
* Add support for variables inspection in debugger.

## v0.51.1 (2019-11-04)

#### :house: Internal
* Fix network timings.

## v0.51.0 (2019-10-23)

#### :tada: New Feature
* Add `web.findElement` and `web.findElements`.

#### :boom: Breaking Change
* `mob.getCaps` renamed to `mob.getCapabilities`.

#### :beetle: Bug Fix
* Number of issues with `mob.findElement` and `mob.findElements`.

## v0.50.2 (2019-10-16)

#### :tada: New Feature
* Add support for setting HTTP headers in `http` module commands.

## v0.50.1 (2019-10-08)

#### :beetle: Bug Fix
* Fixed invalid WDIO dependencies being pulled on install.

## v0.50.0 (2019-10-07)

#### :tada: New Feature
* Add support for authentication details in Selenium and Appium HUB URLs.

## v0.49.0 (2019-10-04)

#### :tada: New Feature
* Add `twilio.sendSms`.

#### :beetle: Bug Fix
* Environment not being read from suite json definition.

#### :nail_care: Polish
* Add handling for 'application is not installed on device' error.
* Handle ChromeDriver version mismatch errors for Appium 1.15+.
* Handle additional 'element not found' errors.

#### :house: Internal
* Use reloadSession instead of manually deleting and creating new sessions.
* Bump dependencies.

## v0.48.7 (2019-09-29)

#### :nail_care: Polish
* Produce proper error when trying to use `web.getBrowserLogs` on unsupported browsers.
* Produce proper error mobile os version mismatch.
* Produce proper error on ChromeDriver version mismatch during context switch.

#### :house: Internal
* Remove Grunt dependency.

## v0.48.6 (2019-09-26)

#### :house: Internal
* Fix HAR not working on Chrome 77 and higher.

## v0.48.5 (2019-09-25)

#### :beetle: Bug Fix
* `web.getXMLPageSource` not working as expected.
* `web.setTimeout` and `mob.setTimeout` not setting the global timeout.

## v0.48.4 (2019-09-25)

#### :nail_care: Polish
* Don't print WDIO warn level logs.
* Produce proper error if `web.fileBrowse` fails due to the element not being interactable.
* `web.makeVisible` will set `disabled` attribute to false.

#### :house: Internal
* Update chrome-har dependency.

## v0.48.3 (2019-09-22)

#### :beetle: Bug Fix
* Issue with wrong WDIO dependency versions being pulled on new installs.
* Fix handling of user specified Appium server URLs in `mob.init`.

#### :nail_care: Polish
* Don't print WDIO info level logs.

## v0.48.2 (2019-09-21)

#### :beetle: Bug Fix
* Fix handling of selenium and appium hub addresses.

## v0.48.1 (2019-09-19)

#### :nail_care: Polish
* Improved error handling.

## v0.48.0 (2019-09-19)

#### :tada: New Feature
* Support for Node.js 12.
* New web commands: `web.isSelected`.
* New mob commands: `mob.closeApp`, `mob.installApp`, `mob.removeApp`, `mob.launchApp`, `mob.resetApp`, `mob.getCurrentAcitivity`, `mob.getCurrentPackage`.
* New pdf commands: `pdf.count`.
* Optional `pageNum` argument for `pdf.assert` and `pdf.assertNot`.
* Optional `timeout` argument for all `mob` and `web` commands. Can be used to set timeouts per command.
* Optional `clickParent` argument for `web.clickHidden`.

#### :boom: Breaking Change
* `mob.verifyTitle`, `mob.verifyTitle`, `mob.verifyValue` removed since those command worked exactly like their `assert*` counterparts.
* `mob.swipe` has been split into two separate commands: `mob.swipe` and `mob.swipeScreen`.
* `mob.hideKeyboard` accepts different arguments and supports more strategies.
* `mob.scrollToElement` accepts different arguments.
* `mob.setAutoWait` and `web.setAutoWait` removed.
* Optional `message` argument has been removed from relevant `mob` commands.

#### :beetle: Bug Fix
* `web.makeVisible` will keep the original element dimensions if non 0.

#### :nail_care: Polish
* Error handling has been significantly improved.

#### :book: Documentation
* Various documentation fixes.

#### :house: Internal
* Upgrade to WebDriverIO v5.
* Bump dependencies.

## v0.47.4 (2019-09-12)
* Fix parameter handling for CSVs produced by OS X Excel.

## v0.47.3 (2019-08-05)
* Internal fixes: Fix HAR fetching on ChromeDriver >= v75

## v0.47.2 (2019-07-28)
* Internal fixes.

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
