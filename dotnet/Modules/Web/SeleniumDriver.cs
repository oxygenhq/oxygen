using OpenQA.Selenium.Remote;
using System;
using System.Collections.Generic;
using System.Reflection;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System.Text.RegularExpressions;
using System.Collections.ObjectModel;

namespace CloudBeat.Oxygen.Modules
{
	// http://release.seleniumhq.org/selenium-core/1.0.1/reference.html
    public partial class SeleniumDriver : RemoteWebDriver
    {
		#region Timeout Defaults
		// Defines the timeout (in seconds) for WebDriver commands. 
        // Due to a bug(?) with PageLoadTimeout not being actualy used by Navigate.GoToUrl for DOMComplete/load events
        // (https://code.google.com/p/chromedriver/issues/detail?id=907) this will also define the timeout for SeOpen command.
        private const int TIMEOUT_COMMAND = 60 * 3;
		// Defines the timeout (in seconds) for fetching the performance timings (domContentLoadedEvent and loadEvent)
        private const int TIMEOUT_TIMINGS = 90;
		// Defines the interval (in milliseconds) for sleeping between the attempts to fetch performance timings.
		private const int TIMEOUT_TIMINGS_SLEEP_INTERVAL = 1000;
		// Specifies the number of retries when attempting to access a stale element.
        private const int STALE_ELEMENT_ATTEMPTS = 20;
		// Defines the timeout (in seconds) for fetching current URL 
		// URL may not be available if the page is still loading - i.e. DOMContentLoaded or Load event hasn't completed yet.
		// Unavailable URL doesn't necessary mean the test couldn't pass, but it does mean that we won't be able to parse the HAR.
		private const int TIMEOUT_FETCH_URL = 60;
		// Defines the timeout (in milliseconds) for the Navigate().GoToUrl command. The aforementioned method will return within 
        // the given timeout disregarding whether the page has finished loading or not. See also TIMEOUT_COMMAND for a bug with DOMComplete/laod events.
		// This value, or rather thee underlying pageLoadTimeout, can be overriden from a script using Selenese SetTimeout command.
		private const int DEFAULT_PAGE_LOAD_TIMEOUT = 60 * 1000;
		// Defines the timeout (in milliseconds) for WaitFor* commands and some assert* commands.
		// This value, or rather the underlying waitForTimeout, can be overriden from a script using Selenese SetTimeout command.
        private const int DEFAULT_WAIT_FOR_TIMEOUT = 60 * 1000;
        // Defines the timeout (in milliseconds) for asynchronous scripts execution.
        private const int DEFAULT_ASYNC_SCRIPT_TIMEOUT = 60 * 1000;
		#endregion

		private int pageLoadTimeout = DEFAULT_PAGE_LOAD_TIMEOUT;
        private int asynScriptTimeout = DEFAULT_ASYNC_SCRIPT_TIMEOUT;
		private int waitForTimeout = DEFAULT_WAIT_FOR_TIMEOUT;

		public const string SE_CMD_METHOD_PREFIX = "SeCmd";

        public string BaseURL { get; set; }

		private ExecutionContext context;

        #region variables dictionary
		public static ReadOnlyDictionary<string, string> constantVariables = new ReadOnlyDictionary<string, string>(new Dictionary<string, string>() 
        {
            {"KEY_BACKSPACE", Keys.Backspace },
            {"KEY_TAB",Keys.Tab},
            {"KEY_ENTER",Keys.Enter},
            {"KEY_SHIFT",Keys.Shift},
            {"KEY_CTRL",Keys.Control},
            {"KEY_ALT",Keys.Alt},
            {"KEY_PAUSE",Keys.Pause},
            {"KEY_ESC",Keys.Escape},
            {"KEY_SPACE",Keys.Space},
            {"KEY_PAGE_UP",Keys.PageUp},
            {"KEY_PAGE_DOWN",Keys.PageDown},
            {"KEY_END",Keys.End},
            {"KEY_HOME",Keys.Home},
            {"KEY_LEFT",Keys.Left},
            {"KEY_UP",Keys.Up},
            {"KEY_RIGHT",Keys.Right},
            {"KEY_DOWN",Keys.Down},
            {"KEY_INSERT",Keys.Insert},
            {"KEY_DELETE",Keys.Delete},
            {"KEY_SEMICOLON",Keys.Semicolon},
            {"KEY_EQUALS",Keys.Equal},
            {"KEY_N0",Keys.NumberPad0},
            {"KEY_N1",Keys.NumberPad1},
            {"KEY_N2",Keys.NumberPad2},
            {"KEY_N3",Keys.NumberPad3},
            {"KEY_N4",Keys.NumberPad4},
            {"KEY_N5",Keys.NumberPad5},
            {"KEY_N6",Keys.NumberPad6},
            {"KEY_N7",Keys.NumberPad7},
            {"KEY_N8",Keys.NumberPad8},
            {"KEY_N9",Keys.NumberPad9},
            {"KEY_MULTIPLY",Keys.Multiply},
            {"KEY_ADD",Keys.Add},
            {"KEY_SEPARATOR",Keys.Separator},
            {"KEY_SUBTRACT",Keys.Subtract},
            {"KEY_MINUS",Keys.Subtract},
            {"KEY_DECIMAL",Keys.Decimal},
            {"KEY_DIVIDE",Keys.Divide},
            {"KEY_F1",Keys.F1},
            {"KEY_F2",Keys.F2},
            {"KEY_F3",Keys.F3},
            {"KEY_F4",Keys.F4},
            {"KEY_F5",Keys.F5},
            {"KEY_F6",Keys.F6},
            {"KEY_F7",Keys.F7},
            {"KEY_F8",Keys.F8},
            {"KEY_F9",Keys.F9},
            {"KEY_F10",Keys.F10},
            {"KEY_F11",Keys.F11},
            {"KEY_F12",Keys.F12},
            {"KEY_META",Keys.Meta},
            {"KEY_COMMAND",Keys.Command}
        });
        #endregion

		public SeleniumDriver(Uri remoteAddress, ICapabilities desiredCapabilities, ExecutionContext context)
            : base(remoteAddress, desiredCapabilities, TimeSpan.FromSeconds(TIMEOUT_COMMAND))
        {
			base.Manage().Timeouts().SetPageLoadTimeout(TimeSpan.FromMilliseconds(pageLoadTimeout));
            base.Manage().Timeouts().SetScriptTimeout(TimeSpan.FromMilliseconds(asynScriptTimeout));

			this.context = context;
			if (context == null)
				this.context = new ExecutionContext();
        }

		public ExecutionContext ExecutionContext { get { return context; } }

        public object ExecuteCommand(Command cmd,  ScreenshotMode screenshotMode, out string screenShot, out Exception exception)
        {
            // substitute object repo locators
            object[] argsProcessed = null;
            if (cmd.Arguments != null)
            {
                argsProcessed = new object[cmd.Arguments.Length];
                for (int i = 0; i < cmd.Arguments.Length; i++)
                {
                    var arg = cmd.Arguments[i];
                    argsProcessed[i] = arg.GetType() == typeof(string) ? SubstituteLocator(arg.ToString()) : arg;
                }
            }

            Type thisType = this.GetType();
            MethodInfo cmdMethod = thisType.GetMethod(SE_CMD_METHOD_PREFIX + cmd.CommandName, BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
            if (cmdMethod == null)
                throw new OxCommandNotImplementedException();

			exception = null;
            screenShot = null;
            try
            {
                var retval = cmdMethod.Invoke(this, argsProcessed);
				if ((screenshotMode == ScreenshotMode.OnAction && cmd.IsAction() == true)
					|| screenshotMode == ScreenshotMode.Always)
					screenShot = TakeScreenshot();
				return retval;
            }
            catch (TargetInvocationException tie)
            {
				if (screenshotMode != ScreenshotMode.Never)
				{
					if (tie.InnerException != null && 
						(tie.InnerException is OxAssertionException || 
						tie.InnerException is OxVerificationException ||
						tie.InnerException is OxWaitForException ||
						tie.InnerException is OxElementNotFoundException ||
						tie.InnerException is OxElementNotVisibleException ||
						tie.InnerException is OxOperationException ||
						tie.InnerException is NoAlertPresentException ||
						tie.InnerException is WebDriverTimeoutException))
					{
						screenShot = TakeScreenshot();
					}
					else if (tie.InnerException != null && tie.InnerException is UnhandledAlertException)
					{
						// can't take screenshots when alert is showing. so capture whole screen
						// this works only localy
						// TODO: linux
						/*if (Environment.OSVersion.Platform.ToString().StartsWith("Win"))
						{
							Rectangle bounds = System.Windows.Forms.Screen.GetBounds(Point.Empty);
							using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
							{
								using (Graphics g = Graphics.FromImage(bitmap))
								{
									g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
								}

								ImageConverter converter = new ImageConverter();
								var sb = (byte[])converter.ConvertTo(bitmap, typeof(byte[]));
								screenShot = Convert.ToBase64String(sb);
							}
						}*/
					}
				}

                // wrap Selenium exceptions. generaly SeCmds throw Oxygen exceptions, however in certain 
                // cases like with ElementNotVisibleException it's simplier to just wrap it out here so we don't need to do it
                // for each FindElement().doSomething
                if (tie.InnerException is ElementNotVisibleException)
                    exception = new OxElementNotVisibleException();
                else if (tie.InnerException is WebDriverTimeoutException)
                    exception = new OxTimeoutException();
                else
                    exception = tie.InnerException;
            }
			finally
			{
				// prevent another exception
				try
				{
					var currentUrl = this.GetCurrentURL();
					var currentTitle = this.GetCurrentTitle();

					// identify a new page if navigation occured (.e.g if URL or page title have changed)
					// look up for a page in local POM first
					var pom = context.PageObjectManager;
                    if (pom != null && currentUrl != null && currentTitle != null)
					{
						if (currentTitle != pom.CurrentPageTitle || currentUrl != pom.CurrentPageUrl)
							pom.IdentifyCurrentPage(currentTitle, currentUrl);
					}
					
				}
				catch (Exception) { }
			}
			return null;
        }

		private string SubstituteLocator(string target)
		{
			if (context.PageObjectManager == null)
				return target;
			if (string.IsNullOrEmpty(target))
				return target;
			if (target.StartsWith("@{") && target.EndsWith("}"))
			{
				// extract the value enclosed in @{...}
				var objectName = target.Substring(2, target.Length - 3);
				var locator = context.PageObjectManager.GetLocator(objectName);
				if (locator == null)
                    throw new OxLocatorUndefined(objectName);
				return locator;
			}
			return target;
		}

		private string TakeScreenshot()
		{
			Response screenshotResponse = this.Execute(DriverCommand.Screenshot, null);
			return screenshotResponse.Value.ToString();
		}

		private string GetCurrentURL()
		{
			string currentUrl = null;
            UnhandledAlertException alert = null;

            // NOTE: DO NOT REMOVE THE FOLLOWING LINE!
            // There seems to be an issue in Chrome WebDriver (or C# bindings?) that if RemoteWebDriver.Url is called after current window was closed, such as a popup,
            // it hangs indefinitely. Fetching WindowHandles seems to resolve this.
            var hndls = this.WindowHandles;

			new WebDriverWait(this, TimeSpan.FromSeconds(TIMEOUT_FETCH_URL)).Until((d) =>
			{
				try
				{
					currentUrl = this.Url;
					return true;
				}
				catch (InvalidOperationException)
				{
					return false;
				}
                catch (NoSuchWindowException)
                {
                    return true;    // exit the wait if window was closed
                }
                catch (UnhandledAlertException uae)
                {
                    alert = uae;
                    return true;    // exit the wait if alert is showing
                }
			});
            if (alert != null)
                throw alert;
			return currentUrl;
		}

		private string GetCurrentTitle()
		{
			string currentTitle = null;
            UnhandledAlertException alert = null;
			new WebDriverWait(this, TimeSpan.FromSeconds(TIMEOUT_FETCH_URL)).Until((d) =>
			{
				try
				{
					currentTitle = this.Title;
					return true;
				}
				catch (InvalidOperationException)
				{
					return false;
				}
                catch (NoSuchWindowException)
                {
                    return true;    // exit the wait if window was closed
                }
                catch (UnhandledAlertException uae)
                {
                    alert = uae;
                    return true;    // exit the wait if alert is showing
                }
			});
            if (alert != null)
                throw alert;
			return currentTitle;
		}


		/*
		 * Since HARs provided by the proxy don't contain any browser level timings, such as domContentLoaded and load event timings,
		 * we try to retrieve them directly from the browser for the currently active page/action.
		 *
		 *  domContentLoaded (aka First Visual Time)- Represents the difference between domContentLoadedEventStart and navigationStart.
		 *  load (aka Full Load Time)				- Represents the difference between loadEventStart and navigationStart.
		 * 
		 * The processing model:
		 * 
		 *  1. navigationStart				- The browser has requested the document.
		 *  2. ...							- Not relevant to us. See http://www.w3.org/TR/navigation-timing/#process for more information.
		 *	3. domLoading					- The browser starts parsing the document.
		 *	4. domInteractive				- The browser has finished parsing the document and the user can interact with the page.
		 *	5. domContentLoadedEventStart	- The document has been completely loaded and parsed and deferred scripts, if any, have executed. 
		 *									  Async scripts, if any, might or might not have executed.
		 *									  Stylesheets[1], images, and subframes might or might not have finished loading.
		 *										[1] - Stylesheets /usually/ defer this event! - http://molily.de/weblog/domcontentloaded
		 *	6. domContentLoadedEventEnd		- The DOMContentLoaded event callback, if any, finished executing. E.g.
		 *										document.addEventListener("DOMContentLoaded", function(event) {
		 *											console.log("DOM fully loaded and parsed");
		 *										});
		 *	7. domComplete					- The DOM tree is completely built. Async scripts, if any, have executed.
		 *	8. loadEventStart				- The browser have finished loading all the resources like images, swf, etc.
		 *	9. loadEventEnd					- The load event callback, if any, finished executing.
		 */
        public bool GetPerformanceTimings(out int domContentLoaded, out int load, out long o_navigationStart)
        {
			int domContentLoadedTmp = 0;
			int loadTmp = 0;
            long navigationStartTmp = long.MinValue;
			bool isSuccess = true;
			try
			{
				new WebDriverWait(new SystemClock(), this, TimeSpan.FromSeconds(TIMEOUT_TIMINGS), TimeSpan.FromSeconds(1)).Until((d) =>
				{
					// NOTE: 
					// InvalidOperationException will be thrown if window.performance.timings is undefined or an error happens during the execution 
					// (e.g. browser unreachable)
					// however since all the browsers we currently use (firefox, chrome) support performance timings, first case is irrelevant
					// and we don't need to handle it for now.
					try
					{
						var timings = (IDictionary<string, object>)(this as IJavaScriptExecutor).ExecuteScript("return {" +
							   "navigationStart: window.performance.timing.navigationStart, " +
							   "domContentLoadedEventStart: window.performance.timing.domContentLoadedEventStart, " +
							   "loadEventStart: window.performance.timing.loadEventStart}");

						var navigationStart = navigationStartTmp = (long)timings["navigationStart"];
						var domContentLoadedEventStart = (long)timings["domContentLoadedEventStart"];
						var loadEventStart = (long)timings["loadEventStart"];

						domContentLoadedTmp = (int)(domContentLoadedEventStart - navigationStart);
						loadTmp = (int)(loadEventStart - navigationStart);

						return domContentLoadedEventStart > 0 && loadEventStart > 0;
					}
                    catch (NoSuchWindowException)
                    {
                        return true;    // exit the wait if window was closed
                    }
                    catch (UnhandledAlertException)
                    {
                        return true;    // exit the wait if alert is showing
                    }
					catch (Exception)
					{
						return false;
					}
				});
			}
			catch (WebDriverTimeoutException)
			{
				isSuccess = false;
				domContentLoadedTmp = 0;
				loadTmp = 0;
			}
			domContentLoaded = domContentLoadedTmp;
			load = loadTmp;
            o_navigationStart = navigationStartTmp;
			return isSuccess;
        }

        public By ResolveLocator(string target)
        {
            string arg;
            string locator = LocatorParse(target, out arg);
            Type type = typeof(OpenQA.Selenium.By);
            MethodInfo cmdMethod = type.GetMethod(locator, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Static);
            return (By)cmdMethod.Invoke(type, new object[] { arg });
        }

        private By ResolveAttributeLocator(string target, out string attributeName)
        {
            // extract the attribute name
            int attIndex = target.LastIndexOf('@');
            if (attIndex <= 0 && attIndex + 1 == target.Length) 
                throw new OxInvalidCommandArgumentException("Cannot extract attribute name from attributeLocator.");
            attributeName = target.Substring(attIndex + 1);
            return ResolveLocator(target.Substring(0, attIndex));
        }

        private IList<KeyValuePair<string, string>> selectors = new List<KeyValuePair<string, string>>() 
        {
            new KeyValuePair<string, string>("value=", "ByValue"),
            new KeyValuePair<string, string>("index=", "ByIndex"),
            new KeyValuePair<string, string>("label=", "ByText")
        };
        private string ParseSelector(string selector, out string selArg)
        {
            foreach (var selType in selectors)
            {
                if (selector.StartsWith(selType.Key))
                {
                    selArg = selector.Substring(selType.Key.Length);
                    return selType.Value;
                }
            }

            // if no prefix - select by text
            selArg = selector;
            return "ByText";
        }

        private IList<KeyValuePair<string, string>> locators = new List<KeyValuePair<string, string>>() 
        {
            new KeyValuePair<string, string>("css=", "CssSelector"),
            new KeyValuePair<string, string>("id=", "Id"),
            new KeyValuePair<string, string>("/", "XPath"),
            new KeyValuePair<string, string>("xpath=", "XPath"),
            new KeyValuePair<string, string>("name=", "Name"),
            new KeyValuePair<string, string>("link=", "LinkText")
        };
        private string LocatorParse(string locator, out string locArg)
        {
            foreach (var locType in locators)
            {
                if (locator.StartsWith(locType.Key))
                {
                    // need special handling for XPath specified with just "/"
                    if (locType.Key == "/")
                        locArg = locator;
                    else
                        locArg = locator.Substring(locType.Key.Length);

                    return locType.Value;
                }
            }

            // no prefix = resolve by id
            locArg = locator;
            return "Id";
        }

        private string CollapseWhitespace(string str)
        {
            return Regex.Replace(str.Trim(), @"\s+", " ");
        }

		private bool MatchPattern(string exp, string pattern)
		{
			// special case
			if (string.IsNullOrEmpty(pattern) && string.IsNullOrEmpty(exp))
			{
				return true;
			}
			// match using a regular-expression
			else if (pattern.StartsWith("regex:"))
			{
                var p = pattern.Substring("regex:".Length).TrimStart();
                return Regex.Match(exp, p).Success;
			}
			// match using a case-insensitive regular-expression
			else if (pattern.StartsWith("regexi:"))
			{
                var p = pattern.Substring("regexi:".Length).TrimStart();
                return Regex.Match(exp, p, RegexOptions.IgnoreCase).Success;
			}
			// match a string exactly, verbatim
			else if (pattern.StartsWith("exact:"))
			{
                return pattern.Substring("exact:".Length).Equals(exp);
			}
			// match against a case-insensitive "glob" pattern
			else if (pattern.StartsWith("glob:"))
			{
				var p = Regex.Escape(pattern.Substring("glob:".Length)).Replace(@"\*", ".*").Replace(@"\?", ".");
                if (p == "")    // otherwise empty string will match everything
                    return exp == p;
                return Regex.Match(exp, @"\A[\s]*" + p + @"[\s]*\Z", RegexOptions.IgnoreCase | RegexOptions.Singleline).Success;
			}
			// no prefix same as glob matching
			else
			{
				var p = Regex.Escape(pattern).Replace(@"\*", ".*").Replace(@"\?", ".");
                if (p == "")
                    return exp == p;
                return Regex.Match(exp, @"\A[\s]*" + p + @"[\s]*\Z", RegexOptions.IgnoreCase | RegexOptions.Singleline).Success;
			}
		}
    }
}
