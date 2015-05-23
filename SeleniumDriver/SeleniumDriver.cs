using OpenQA.Selenium.Remote;
using System;
using System.Collections.Generic;
using System.Reflection;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System.Linq;
using log4net;
using System.Text.RegularExpressions;
using Selenium.Parameters;
using CloudBeat.Selenium.Models;

namespace CloudBeat.Selenium
{
	// http://release.seleniumhq.org/selenium-core/1.0.1/reference.html
    public partial class SeleniumDriver : RemoteWebDriver
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

		#region Timeout Defaults
		// Defines the timeout (in seconds) for WebDriver commands. 
        // Due to a bug(?) with PageLoadTimeout not being actualy used by Navigate.GoToUrl for DOMComplete/load events
        // (https://code.google.com/p/chromedriver/issues/detail?id=907) this will also define the timeout for SeOpen command.
        private const int TIMEOUT_COMMAND = 60 * 3;
		// Defines the timeout (in seconds) for miscellaneous assertion actions - TextAssert, TitleAssert, AssertAlert, etc.
        private const int TIMEOUT_ASSERT = 10;
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
		private const int DEFAULT_PAGE_LOAD_TIMEOUT = 180*1000;
		// Defines the timeout (in milliseconds) for WaitFor* commands.
		// This value, or rather the underlying waitForTimeout, can be overriden from a script using Selenese SetTimeout command.
        private const int DEFAULT_WAIT_FOR_TIMEOUT = 60000;
        // Defines the timeout for asynchronous scripts execution.
        private const int DEFAULT_ASYNC_SCRIPT_TIMEOUT = 60 * 3;
		#endregion

		private int pageLoadTimeout = DEFAULT_PAGE_LOAD_TIMEOUT;
        private int asynScriptTimeout = DEFAULT_ASYNC_SCRIPT_TIMEOUT;
		private int waitForTimeout = DEFAULT_WAIT_FOR_TIMEOUT;

		public const string SE_CMD_METHOD_PREFIX = "SeCmd";

        public string BaseURL { get; set; }

		private PageObjectManager pageObjectManager;
		private ParameterManager paramManager;

        private Action<string> newHarPageCallback;

        #region variables dictionary
        private IDictionary<string, string> variables = new Dictionary<string, string>() 
        {
            {"KEY_BACKSPACE", Keys.Backspace },
            {"KEY_BKSP",Keys.Backspace},
            {"KEY_TAB",Keys.Tab},
            {"KEY_ENTER",Keys.Enter},
            {"KEY_SHIFT",Keys.Shift},
            {"KEY_CONTROL",Keys.Control},
            {"KEY_CTRL",Keys.Control},
            {"KEY_ALT",Keys.Alt},
            {"KEY_PAUSE",Keys.Pause},
            {"KEY_ESC",Keys.Escape},
            {"KEY_ESCAPE",Keys.Escape},
            {"KEY_SPACE",Keys.Space},
            {"KEY_PAGE_UP",Keys.PageUp},
            {"KEY_PGUP",Keys.PageUp},
            {"KEY_PAGE_DOWN",Keys.PageDown},
            {"KEY_PGDN",Keys.PageDown},
            {"KEY_END",Keys.End},
            {"KEY_HOME",Keys.Home},
            {"KEY_LEFT",Keys.Left},
            {"KEY_UP",Keys.Up},
            {"KEY_RIGHT",Keys.Right},
            {"KEY_DOWN",Keys.Down},
            {"KEY_INSERT",Keys.Insert},
            {"KEY_INS",Keys.Insert},
            {"KEY_DELETE",Keys.Delete},
            {"KEY_DEL",Keys.Delete},
            {"KEY_SEMICOLON",Keys.Semicolon},
            {"KEY_EQUALS",Keys.Equal},
            {"KEY_NUMPAD0",Keys.NumberPad0},
            {"KEY_N0",Keys.NumberPad0},
            {"KEY_NUMPAD1",Keys.NumberPad1},
            {"KEY_N1",Keys.NumberPad1},
            {"KEY_NUMPAD2",Keys.NumberPad2},
            {"KEY_N2",Keys.NumberPad2},
            {"KEY_NUMPAD3",Keys.NumberPad3},
            {"KEY_N3",Keys.NumberPad3},
            {"KEY_NUMPAD4",Keys.NumberPad4},
            {"KEY_N4",Keys.NumberPad4},
            {"KEY_NUMPAD5",Keys.NumberPad5},
            {"KEY_N5",Keys.NumberPad5},
            {"KEY_NUMPAD6",Keys.NumberPad6},
            {"KEY_N6",Keys.NumberPad6},
            {"KEY_NUMPAD7",Keys.NumberPad7},
            {"KEY_N7",Keys.NumberPad7},
            {"KEY_NUMPAD8",Keys.NumberPad8},
            {"KEY_N8",Keys.NumberPad8},
            {"KEY_NUMPAD9",Keys.NumberPad9},
            {"KEY_N9",Keys.NumberPad9},
            {"KEY_MULTIPLY",Keys.Multiply},
            {"KEY_MUL",Keys.Multiply},
            {"KEY_ADD",Keys.Add},
            {"KEY_PLUS",Keys.Add},
            {"KEY_SEPARATOR",Keys.Separator},
            {"KEY_SEP",Keys.Separator},
            {"KEY_SUBTRACT",Keys.Subtract},
            {"KEY_MINUS",Keys.Subtract},
            {"KEY_DECIMAL",Keys.Decimal},
            /*{"KEY_PERIOD",Keys.},*/ 
            {"KEY_DIVIDE",Keys.Divide},
            {"KEY_DIV",Keys.Divide},
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
        };
        #endregion

        public SeleniumDriver(Uri remoteAddress, ICapabilities desiredCapabilities, Action<string> newHarPageCallback)
            : base(remoteAddress, desiredCapabilities, TimeSpan.FromSeconds(TIMEOUT_COMMAND))
        {
            this.newHarPageCallback = newHarPageCallback;
			base.Manage().Timeouts().SetPageLoadTimeout(TimeSpan.FromMilliseconds(pageLoadTimeout));
            base.Manage().Timeouts().SetScriptTimeout(TimeSpan.FromMilliseconds(asynScriptTimeout));

			paramManager = new ParameterManager();
			pageObjectManager = new PageObjectManager();
        }

        public void StartNewTransaction(string name)
        {
            if (newHarPageCallback != null)
                newHarPageCallback(name);
        }

        public object ExecuteCommand(SeCommand cmd,  bool screenShotErrors, out string screenShot)
        {
            Type thisType = this.GetType();

			// While Selenese commands with *AndWait suffix imply that the command will block until the page has been loaded
			// On the WebDriver's level we don't have such distinction since Click() (among others) will AUTOMATICALLY try 
			// to block if it recognizes page transition.
			// Therefore on WebDriver's level, commands with and without *AndWait suffix act the same.
			// NOTE: this doesn't allways seem to be the case: https://code.google.com/p/selenium/wiki/FrequentlyAskedQuestions#Q%3a_WebDriver_fails_to_find_elements_/_Does_not_block_on_page_loa
			string commandName = cmd.CommandName;
			if (cmd.CommandName.EndsWith("AndWait", StringComparison.InvariantCultureIgnoreCase))
				commandName = cmd.CommandName.Remove(cmd.CommandName.Length-"AndWait".Length);

            var target = SubstituteVariable(cmd.Target);
			target = SubstituteLocator(target);
            var value = SubstituteVariable(cmd.Value);

			MethodInfo cmdMethod = thisType.GetMethod(SE_CMD_METHOD_PREFIX+commandName, BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
            if (cmdMethod == null)
                throw new SeCommandNotImplementedException();

            screenShot = null;
            try
            {
                return cmdMethod.Invoke(this, new object[] { target, value });
            }
            catch (TargetInvocationException tie)
            {
				if (screenShotErrors && tie.InnerException != null && 
					(tie.InnerException is SeAssertionException || 
                    tie.InnerException is SeVerificationException ||
					tie.InnerException is NoSuchElementException || 
					tie.InnerException is SeWaitForException ||
					tie.InnerException is WebDriverException ||
					tie.InnerException is WebDriverTimeoutException))
                {
					screenShot = TakeScreenshot();
                }

                throw tie.InnerException;
            }
			finally
			{
				// prevent another exception
				try
				{
					var currentUrl = this.GetCurrentURL();
					var currentTitle = this.GetCurrentTitle();
					// identify if navigation occured and we are on a new page
					if (currentTitle != pageObjectManager.CurrentPageTitle || currentUrl != pageObjectManager.CurrentPageUrl)
						pageObjectManager.IdentifyCurrentPage(currentTitle, currentUrl, false);
				}
				catch (Exception e) { }
			}
        }

		public ParameterManager ParameterManager { get { return paramManager; } }

        public void AddParameter(string name, string value)
        {
            variables.Add(name, value);
        }

        public void AddPageObjects(PageObjects pageObjects)
        {
            pageObjectManager.AddObjects(pageObjects);
        }
		public void AddParameters(IParameterReader reader)
		{
			paramManager.AddParameters(reader);
		}
		public void AddParameters(ParameterSourceSettings settings)
		{
			var reader = ParameterReaderFactory.Create(settings);
            paramManager.TestCaseName = settings.TestCaseName;
			paramManager.AddParameters(reader);
		}

        private string SubstituteVariable(string str) 
        {
            if (str == null)
                return null;

            while (true)
            {
                var varIndexStart = str.IndexOf("${");
                if (varIndexStart == -1)
                    return str;

                var varIndexEnd = str.IndexOf('}', varIndexStart + 2);
                var variableName = str.Substring(varIndexStart + 2, varIndexEnd - varIndexStart - 2);

                if (variables.ContainsKey(variableName.ToUpper()))
                {
                    str = str.Substring(0, varIndexStart) + variables[variableName.ToUpper()] + str.Substring(varIndexEnd + 1);
                }

                else
                {
					try
					{
                        var value = paramManager.GetValue(variableName);
						str = str.Substring(0, varIndexStart) + value + str.Substring(varIndexEnd + 1);
					}
					catch (Exception)
					{
                        throw new SeVariableUndefined(variableName);
					}
                }
            }
        }
		private string SubstituteLocator(string target)
		{
			if (pageObjectManager == null)
				return target;
			if (string.IsNullOrEmpty(target))
				return target;
			if (target.StartsWith("@{") && target.EndsWith("}"))
			{
				// extract the value enclosed in @{...}
				var objectName = target.Substring(2, target.Length - 3);
				var locator = pageObjectManager.GetLocator(objectName);
				if (locator == null)
                    throw new SeLocatorUndefined(objectName);
				return locator;
			}
			return target;
		}

		public string TakeScreenshot()
		{
			Response screenshotResponse = this.Execute(DriverCommand.Screenshot, null);
			return screenshotResponse.Value.ToString();
		}

        public static IList<string> GetSupportedCommands() 
        {
            Type myType = typeof(SeleniumDriver);
            MethodInfo[] cmdMethods = myType.GetMethods(BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            return cmdMethods.Where(x => x.Name.StartsWith(SE_CMD_METHOD_PREFIX)).Select(x => x.Name.Substring(SE_CMD_METHOD_PREFIX.Length)).ToList();
        }

		public string GetCurrentURL()
		{
			string currentUrl = null;

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
			});

			return currentUrl;
		}
		public string GetCurrentTitle()
		{
			string currentTitle = null;

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
			});

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

        private By ResolveLocator(string target)
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
                throw new SeInvalidCommandArgumentException("Cannot extract attribute name from attributeLocator.");
            attributeName = target.Substring(attIndex + 1);
            return ResolveLocator(target.Substring(0, attIndex));
        }

        private IList<KeyValuePair<string, string>> selectors = new List<KeyValuePair<string, string>>() 
        {
            new KeyValuePair<string, string>("value=", "SelectByValue"),
            new KeyValuePair<string, string>("index=", "SelectByIndex"),
            new KeyValuePair<string, string>("label=", "SelectByText")
        };
        private string ParseSelector(string selector, out string selArg)
        {
            // id selector is not supported in the webdriver
            if (selector.StartsWith("id="))
            {
                // FIXME: see http://release.seleniumhq.org/selenium-core/1.0.1/reference.html
                // bad things...
            }
            
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
            return "SelectByText";
        }

        private IList<KeyValuePair<string, string>> locators = new List<KeyValuePair<string, string>>() 
        {
            new KeyValuePair<string, string>("css=", "CssSelector"),
            new KeyValuePair<string, string>("id=", "Id"),
            new KeyValuePair<string, string>("//", "XPath"),
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
                    // need special handling for XPath specified with just "//"
                    if (locType.Key == "//")
                        locArg = locator;
                    else
                        locArg = locator.Substring(locType.Key.Length);

                    return locType.Value;
                }
            }

            // Without an explicit locator prefix, Selenium uses the following default strategies:
            //  - dom, for locators starting with "document."
            //  - xpath, for locators starting with "//"
            //  - no identifier, select the element with the specified @id attribute. If no match is found, 
            //    select the first element with the specified @name attribute.
            if (locator.StartsWith("document."))
            {
                throw new NotImplementedException("'document.' locator prefix is not implemented yet!");
            }
            else
            {
                // for now we just try resolving by @id. TODO: @name
                locArg = locator;
                return "Id";
            }
        }

        private bool IsElementPresent(By by)
        {
            try
            {
                this.FindElement(by);
                return true;
            }
            catch (NoSuchElementException)
            {
                return false;
            }
        }

		public bool IsElementPresent(string target)
		{
			return IsElementPresent(ResolveLocator(target));
		}

        public void SeCmdWaitForPageToLoad(string target, string value)
        {
            // this method does nothing as the preceding open/click/clickandwait/etc will do the actual waiting anyway
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
			// regexp:regexp: Match a string using a regular-expression. The full power of JavaScript regular-expressions is available.
			else if (pattern.StartsWith("regexp:"))
			{
				// this will require a tricky implimentation since the pattern is specified in JavaScript regex and we would need to translate to .NET regex
				throw new NotImplementedException();
			}
			// regexpi:regexpi: Match a string using a case-insensitive regular-expression.
			else if (pattern.StartsWith("regexpi:"))
			{
				throw new NotImplementedException();
			}
			// exact:string: Match a string exactly, verbatim, without any of that fancy wildcard stuff.
			else if (pattern.StartsWith("exact:"))
			{
                return pattern.Substring("exact:".Length).Equals(exp);
			}
			// glob:pattern: Match a string against a "glob" (aka "wildmat") pattern. 
			// "Glob" is a kind of limited regular-expression syntax typically used in command-line shells. 
			// In a glob pattern, "*" represents any sequence of characters, and "?" represents any single character. 
			// Glob patterns match against the entire string.
			else if (pattern.StartsWith("glob:"))
			{
				var p = Regex.Escape(pattern.Substring("glob:".Length)).Replace(@"\*", ".*").Replace(@"\?", ".");
				return Regex.Match(exp, p).Success;
			}
			// no prefix same as Glob matching
			else
			{
				var p = Regex.Escape(pattern).Replace(@"\*", ".*").Replace(@"\?", ".");
                return Regex.Match(exp, p).Success;
			}
		}
    }
}
