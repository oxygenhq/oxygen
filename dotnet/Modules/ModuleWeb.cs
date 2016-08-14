using CloudBeat.Oxygen.Models;
using CloudBeat.Oxygen.ProxyClient;
using log4net;
using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Reflection;
using System.Threading;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleWeb : IModule
	{
		private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private SeleniumDriver driver;
        private BMPClient proxyClient = null;
        private const string PROXY_LOCAL_ADDR = "127.0.0.1";

        public delegate void TransactionEventHandler(string transaction);
        public event TransactionEventHandler TransactionUpdate;

        private ScreenshotMode screenshotMode = ScreenshotMode.OnError;
        private bool fetchStats = true;
		private bool reopenBrowserOnIteration = false;
        private long prevNavigationStart = long.MinValue;
		private bool initialized = false;
		private bool autoInitDriver = false;
		private string seleniumUrl;
		private string proxyUrl;
		private DesiredCapabilities capabilities;
		private ExecutionContext ctx;

        private HashSet<string> transactions = new HashSet<string>();

		#region Defauts
		private const string DEFAULT_BROWSER_NAME = "internetexplorer";
		private const int TIMEOUT_WINDOW_SIZE = 60; // in seconds
		private const int BROWSER_H = 900;
		private const int BROWSER_W = 1600;

		private const int BMP_READ_TIMEOUT = 300000;	// in ms
		private const int BMP_CON_TIMEOUT = 300000;		// in ms

		private const int PROXY_CONN_RETRY_COUNT = 5;
		private const int SELENIUM_CONN_RETRY_COUNT = 2;
		#endregion

		#region Argument Names
		const string ARG_PROXY_URL = "web@proxyUrl";
		const string ARG_SELENIUM_URL = "web@seleniumUrl";
		const string ARG_INIT_DRIVER = "web@initDriver";
		const string ARG_BROWSER_NAME = "web@browserName";
		const string ARG_REOPEN_BROWSER = "web@reopenBrowser";
		#endregion

		public ModuleWeb()
		{

		}
		public ModuleWeb(bool fetchStats, ScreenshotMode screenshotMode)
        {
			this.screenshotMode = screenshotMode;
            this.fetchStats = fetchStats;
        }

		public string Name { get { return "Web"; } }

		#region General Public Functions
		public void SetDriver(SeleniumDriver driver)
        {
			this.driver = driver;
        }
		public object IterationStarted()
		{
			// initialize selenium driver if auto init option is on and the driver is not initialized already
			if (!initialized && autoInitDriver)
				InitializeSeleniumDriver();
			if (proxyClient != null)
				proxyClient.NewHar(true);
			return null;
		}
		public object IterationEnded()
		{
			if (proxyClient != null)
				return proxyClient.GetHarJson();
			if (reopenBrowserOnIteration)
				Dispose();		
			return null;
		}
		public bool Initialize(Dictionary<string, string> args, ExecutionContext ctx)
		{
			this.ctx = ctx;

			if (args.ContainsKey(ARG_PROXY_URL))
				proxyUrl = args[ARG_PROXY_URL];
			if (args.ContainsKey(ARG_SELENIUM_URL) && !string.IsNullOrEmpty(args[ARG_SELENIUM_URL]))
				seleniumUrl = args[ARG_SELENIUM_URL];
			//else
				//throw new ArgumentNullException(ARG_SELENIUM_URL);
			autoInitDriver = args.ContainsKey(ARG_INIT_DRIVER) && args[ARG_INIT_DRIVER] == "true";
			reopenBrowserOnIteration = args.ContainsKey(ARG_REOPEN_BROWSER) && args[ARG_REOPEN_BROWSER] == "true";
			// initialize DesiredCapabilities with provided browser
			if (args.ContainsKey(ARG_BROWSER_NAME))
				capabilities = DCFactory.Get(args[ARG_BROWSER_NAME]);
			// add other capabilities if specified in arguments
			foreach (var key in args.Keys)
			{
				if (!key.StartsWith("web@cap:"))
					continue;
				if (capabilities == null)
					capabilities = new DesiredCapabilities();
				var capName = key.Replace("web@cap:", "");
				var capVal = args[key];
				capabilities.SetCapability(capName, capVal);
			}
			if (autoInitDriver)
				InitializeSeleniumDriver();
			initialized = true;
			return true;
		}
		public void Quit()
		{
			Dispose();
		}
		protected void InitializeSeleniumDriver()
		{
			//BMPClient proxyClient = null;
			if (!string.IsNullOrEmpty(proxyUrl))
				proxyClient = ConnectToProxy(proxyUrl);
			if (capabilities == null)
				capabilities = DCFactory.Get(DEFAULT_BROWSER_NAME);

            if (proxyClient != null)
            {
                var proxyPort = proxyClient.SeleniumProxy.Substring(proxyClient.SeleniumProxy.IndexOf(':'));
                OpenQA.Selenium.Proxy proxy = new OpenQA.Selenium.Proxy
                {
                    HttpProxy = PROXY_LOCAL_ADDR + proxyPort,
                    SslProxy = PROXY_LOCAL_ADDR + proxyPort
                };
                capabilities.SetCapability(CapabilityType.Proxy, proxy);
            }

			try
			{
				driver = ConnectToSelenium(capabilities, proxyClient, seleniumUrl, ctx);
                if (!SetWindowSize(driver))
                    throw new OxSetWindowSizeException();
			}
			catch (Exception e)
			{
				log.Fatal("Can't initialize web module: " + e.Message);
				throw new OxModuleInitializationException("Can't initialize web module", e);
			}
			if (driver == null)
				throw new OxModuleInitializationException("Can't initialize Selenium driver in web module");
			
		}
		protected BMPClient ConnectToProxy(string proxyUrl)
		{
			// Due to a possible race condition in the proxy when it tries to find a new port for the proxy server
			// we might get an WebException with Responce.StatusCode set to InternalServerError
			// This means the proxy is alive but hit a blocked port when initializing new proxy server. Hence we retry until success.
			// All other exceptions mean proxy is down or network problems.
			int connectAttempt = 0;
			BMPClient client = null;
			Exception orgException = null;
			do
			{
				try
				{
					client = new BMPClient(proxyUrl);
				}
				catch (Exception e)
				{
					var we = e as WebException;
					if (we != null && we.Response != null && we.Response is HttpWebResponse && ((HttpWebResponse)we.Response).StatusDescription == "550")
					{
						orgException = we;
						connectAttempt++;
						continue;
					}

					log.Fatal("Error connecting to proxy", e);
					throw new Exception("Can't initialize proxy: " + e.Message);
				}
				break;
			} while (connectAttempt < PROXY_CONN_RETRY_COUNT);
			if (client == null)
			{
				if (orgException != null)
					throw new Exception("Can't initialize proxy, connection attempts failed: " + orgException.Message);
				throw new Exception("Can't initialize proxy, connection attempts failed");
			}
			try
			{
				//client.NewHar(true); // now called in IterationStarted
				client.SetTimeouts(new TimeoutOptions { ReadTimeout = BMP_READ_TIMEOUT, ConnectionTimeout = BMP_CON_TIMEOUT });
			}
			catch (Exception e)
			{
				log.Fatal("Error configuring the proxy", e);
				throw new Exception("Can't initialize proxy: " + e.Message);
			}
			return client;
		}

		private void NewHarPageCallbackHandler(BMPClient proxyClient, string name)
		{
			if (proxyClient != null)
				proxyClient.NewPage(name);
		}

		protected SeleniumDriver ConnectToSelenium(DesiredCapabilities dc, BMPClient proxyClient, string seleniumUrl, CloudBeat.Oxygen.ExecutionContext context)
		{
			int connectAttempt = 0;
			while (true)
			{
				try
				{
					return new SeleniumDriver(new Uri(seleniumUrl), dc, (x) => NewHarPageCallbackHandler(proxyClient, x), context);
				}
				catch (Exception e)
				{
					if (e is WebDriverException)
					{
						var we = e.InnerException as WebException;
						if (we != null && we.Status == WebExceptionStatus.Timeout)
						{
							connectAttempt++;
							if (connectAttempt >= SELENIUM_CONN_RETRY_COUNT)
							{
								log.Fatal("Unable to connect to Selenium server", e);
								throw;
							}
							Thread.Sleep(1000);	// in case the failure was due to resources overload - wait a bit...
							continue;
						}
						else if (e.Message.Contains("Unable to connect to the remote server"))
						{
							log.Fatal("Unable to connect to Selenium server", e);
							throw new Exception("Unable to connect to Selenium server: " + seleniumUrl);
						}
					}
						
					log.Fatal("SeleniumDriver initializing failed", e);
					throw;
				}
			}
		}

		protected bool SetWindowSize(SeleniumDriver cmdProc)
		{
			// If Window.Size is called too soon before the browser/driver finished intializing
			// we might receive a NoSuchFrameException exception.
			// To avoid this, we retry multiple times till we succeed or maximum numer of retries is reached
			// See issue #9.
			try
			{
				new WebDriverWait(cmdProc, TimeSpan.FromSeconds(TIMEOUT_WINDOW_SIZE)).Until((d) =>
				{
					try
					{
                        cmdProc.Manage().Window.Maximize();// Size = new System.Drawing.Size(BROWSER_W, BROWSER_H);
						return true;
					}
					catch (Exception)
					{
						return false;
					}
				});
			}
			catch (WebDriverTimeoutException e)
			{
				log.Error("Couldn't set window size.", e);
				return false;
			}
			return true;
		}

        public bool Dispose()
        {
            try
            {
                if (driver != null)
					driver.Quit();
				if (proxyClient != null)
					proxyClient.Close();
            }
            catch (Exception) { } // ignore exceptions
			driver = null;
			proxyClient = null;
			initialized = false;
			return true;
        }

		public bool IsInitialized { get { return initialized; } }

        public void SetBaseUrl(string url)
        {
			ExecuteSeleniumCommand(url);
        }

		#endregion

		#region Selenium Standard Commands Implementation

		public void Init(string seleniumUrl, Dictionary<string, string> caps, bool resetDefaultCaps = true)
		{
			if (driver != null)
				throw new Exception("Selenium driver has been already initialized");
			// override current selenium url if new is passed in this function
			if (!string.IsNullOrEmpty(seleniumUrl))
				this.seleniumUrl = seleniumUrl;
			if (resetDefaultCaps || this.capabilities == null)
				this.capabilities = new DesiredCapabilities();
			if (caps != null)
			{
				foreach (var cap in caps)
					this.capabilities.SetCapability(cap.Key, cap.Value);
			}
			InitializeSeleniumDriver();
		}

        public string GetSessionId()
        {
            if (driver == null)
                throw new OxModuleInitializationException("Selenium driver is not initialized in web module");
            var sessionIdProperty = typeof(RemoteWebDriver).GetProperty("SessionId", BindingFlags.Instance | BindingFlags.NonPublic);
            SessionId sessionId = sessionIdProperty.GetValue(driver, null) as SessionId;
            if (sessionId != null)
                return sessionId.ToString();
            return null;
        }

        public void transaction(string name)
        {
            // throw in case we hit a duplicate transaction
            if (transactions.Contains(name))
            {
                var e = new OxDuplicateTransactionException("Duplicate transaction found: \"" + name + "\". Transactions must be unique.");
                // TODO: thwo on duplicate trnsactions
            }
            transactions.Add(name);
			driver.StartNewTransaction(name);
            if (TransactionUpdate != null)   
                TransactionUpdate(name);
        }
		public CommandResult SetTimeout(int timeout)
        {
            return ExecuteSeleniumCommand(timeout);
        }
		public CommandResult Open(string url)
        {
            return ExecuteSeleniumCommand(url);
        }

		public CommandResult Point(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }

		public CommandResult ScrollToElement(string locator, int yOffset)
        {
            return ExecuteSeleniumCommand(locator, yOffset.ToString());
        }

		public CommandResult Click(string locator)
		{
            return ExecuteSeleniumCommand(locator);
		}
		public CommandResult ClickHidden(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult AssertTitle(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public CommandResult Type(string locator, string value)
        {
            return ExecuteSeleniumCommand(locator, value);
        }
		public CommandResult Clear(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult AssertText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult SelectWindow(string windowLocator)
        {
            return ExecuteSeleniumCommand(windowLocator);
        }
		public CommandResult GetText(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult GetAttribute(string locator, string attributeName)
        {
            return ExecuteSeleniumCommand(locator, attributeName);
        }
		public CommandResult GetValue(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult DoubleClick(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult Select(string selectLocator, string optionLocator)
        {
            return ExecuteSeleniumCommand(selectLocator, optionLocator);
        }
		public CommandResult Deselect(string selectLocator, string optionLocator)
        {
            return ExecuteSeleniumCommand(selectLocator, optionLocator);
        }
		public CommandResult Pause(int waitTime)
        {
            return ExecuteSeleniumCommand(waitTime);
        }
		public CommandResult WaitForPopUp(string windowID, int timeout)
        {
            return ExecuteSeleniumCommand(windowID, timeout);
        }
		public CommandResult SelectFrame(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult WaitForVisible(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult WaitForElementPresent(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult IsElementPresent(string locator, int timeout)
        {
            return ExecuteSeleniumCommand(locator, timeout);
        }
		public CommandResult IsElementVisible(string locator, int timeout)
        {
            return ExecuteSeleniumCommand(locator, timeout);
        }
		public CommandResult WaitForText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult WaitForNotText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult WaitForValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult WaitForNotValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult AssertValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public CommandResult AssertTextPresent(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public CommandResult AssertElementPresent(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public CommandResult AssertAlert(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public CommandResult GetPageSource()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult GetXMLPageSource()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult GetXMLPageSourceAsJSON()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult GetWindowHandles()
        {
            return ExecuteSeleniumCommand();
        }
        public CommandResult getElementCount(string xpath)
        {
            return ExecuteSeleniumCommand(xpath);
        }
		public CommandResult CloseWindow()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult IsAlertPresent(string text, int timeout)
        {
            return ExecuteSeleniumCommand(text, timeout);
        }
		public CommandResult AlertAccept()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult AlertDismiss()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult AssertSelectedLabel(string locator, string text)
        {
            return ExecuteSeleniumCommand(locator, text);
        }
		public CommandResult AssertSelectedValue(string locator, string value)
        {
            return ExecuteSeleniumCommand(locator, value);
        }
		public CommandResult GetAlertText()
        {
            return ExecuteSeleniumCommand();
        }
		public CommandResult ExecuteScript(string script)
        {
            return ExecuteSeleniumCommand(script);
        }
        public CommandResult FileBrowse(string filepath)
        {
            return ExecuteSeleniumCommand(filepath);
        }
        public CommandResult MakeVisible(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		#endregion

		#region Internal Methods Implementation
		private CommandResult ExecuteSeleniumCommand(params object[] args)
        {
			if (driver == null)
				throw new OxModuleInitializationException("Selenium driver is not initialized in web module");

            // execute the command
            string screenShot = null;

            var name = new StackTrace().GetFrame(1).GetMethod().Name;
			if (string.IsNullOrEmpty(name))
				throw new ArgumentNullException("name", "Selenium command name is null or empty");
            // when used from within the Jurassic wrapper with optimization turned on 
            // the name will be "binder_for_CloudBeat.Oxygen.JSEngine.ModuleWebJurassic.CMD"
            if (name.StartsWith("binder_for"))
                name = name.Substring(name.LastIndexOf('.') + 1);
			// lowercase the first letter
			name = Char.ToLowerInvariant(name[0]) + name.Substring(1);

            var cmd = new SeCommand
            {
                CommandName = name,
                Arguments = args
            };
			var result = new CommandResult()
			{
				CommandName = cmd.ToJSCommand()
			};

            try
            {
				result.StartTime = DateTime.UtcNow;
				// expected exceptions won't be thrown but rather returned by 'exception' output parameter
				Exception exception = null;
				var retVal = driver.ExecuteCommand(cmd, screenshotMode, out screenShot, out exception);
				
				result.IsAction = cmd.IsAction();
				result.Screenshot = screenShot;
				result.ReturnValue = retVal;
				result.IsSuccess = exception == null;
				if (exception != null)
				{
					result.ErrorType = exception.GetType().ToString();
					result.ErrorMessage = exception.Message;
					result.ErrorDetails = exception.StackTrace;
					string statusData = null;
					var status = GetStatusByException(exception, out statusData);
					result.StatusText = status.ToString();
					result.StatusData = statusData;
				}

                int domContentLoaded = 0;
                int load = 0;

                if (fetchStats)
                {
                    long navigationStart = 0;

                    if (cmd.IsAction())
                    {
                        if (driver.GetPerformanceTimings(out domContentLoaded, out load, out navigationStart))
                        {
                            // if navigateStart equals to the one we got from previous attempt
                            // it means we are still on the same page and don't need to record load/domContentLoaded times
                            if (prevNavigationStart == navigationStart)
                                load = domContentLoaded = 0;
                            else
                                prevNavigationStart = navigationStart;
                        }
						result.DomContentLoadedEvent = domContentLoaded;
						result.LoadEvent = load;
                    }
                }

                result.EndTime = DateTime.UtcNow;
                result.Duration = (result.EndTime - result.StartTime).TotalSeconds;

                return result;
            }
            catch (Exception e)
            {
				result.EndTime = DateTime.UtcNow;
                result.Duration = (result.EndTime - result.StartTime).TotalSeconds;
				result.IsAction = cmd.IsAction();
				result.IsSuccess = false;
				result.Screenshot = screenShot;
				result.ErrorType = e.GetType().ToString();
				result.ErrorMessage = e.Message;
				result.ErrorDetails = e.StackTrace;
				string statusData = null;
				var status = GetStatusByException(e, out statusData);
				result.StatusText = status.ToString();
				result.StatusData = statusData;
				if (status == CheckResultStatus.UNKNOWN_ERROR)
				{
					e.Data.Add("Cmd: ", cmd.ToString());
					log.Error("Unknown WebDriverException. Needs checking!!!", e);
				}
            }

            return result;
        }

		private CheckResultStatus GetStatusByException(Exception e, out string moreInfo)
		{
			var type = e.GetType();
			moreInfo = null;

			if (type == typeof(OxAssertionException))
				return CheckResultStatus.ASSERT;
			else if (type == typeof(OxVerificationException))
				return CheckResultStatus.VERIFICATION;
			else if (type == typeof(NoSuchElementException))
				return CheckResultStatus.NO_ELEMENT;
			else if (type == typeof(OxElementNotFoundException))
				return CheckResultStatus.NO_ELEMENT;
			else if (type == typeof(OxElementNotVisibleException))
				return CheckResultStatus.ELEMENT_NOT_VISIBLE;
			else if (type == typeof(NoSuchFrameException))
				return CheckResultStatus.FRAME_NOT_FOUND;
			else if (type == typeof(StaleElementReferenceException))
				return CheckResultStatus.STALE_ELEMENT;
			else if (type == typeof(UnhandledAlertException))
			{
				moreInfo = "Alert text: " + driver.SeCmdGetAlertText();
				return CheckResultStatus.UNHANDLED_ALERT;
			}
			else if (type == typeof(OxWaitForException))
				// This is thrown by any WaitFor* commands (e.g. SeCmdWaitForVisible)
				// and essentially implies a script level timeout.
				// By default the timeout is set to SeCommandProcessor.DEFAULT_WAIT_FOR_TIMEOUT but
				// can be overriden in the script using SetTimeout command.
				return CheckResultStatus.SCRIPT_TIMEOUT;
			else if (type == typeof(OxTimeoutException))
				// This is thrown by any commands which rely on PageLoadTimeout (Open, Click, etc.)
				// and essentially implies a script level timeout.
				// By default the timeout is set to SeCommandProcessor.DEFAULT_PAGE_LOAD_TIMEOUT but
				// can be overriden in the script using SetTimeout command.
				return CheckResultStatus.SCRIPT_TIMEOUT;
			else if (type == typeof(WebDriverException))
			{
				var wde = e as WebDriverException;

				// This is thrown when WebDriver does not respond within the command timeout period defined by SeCommandProcessor.TIMEOUT_COMMAND
				// and may occur due to multiple reasons: network errors, webdriver locking due to browser/internal bugs, etc.
				if (wde.InnerException != null && wde.InnerException is WebException)
				{
					var wex = wde.InnerException as WebException;
					if (wex.Status == WebExceptionStatus.Timeout)
						// there seems to be chromedriver bug where open/click will end in command timeout if 'load' event did not fire.
						return CheckResultStatus.SCRIPT_TIMEOUT;
				}
				log.Error("Unknown WebDriverException. Needs checking!!!", wde);
				return CheckResultStatus.UNKNOWN_ERROR;
			}
			else if (type == typeof(OxVariableUndefined))
			{
				moreInfo = e.Message;
				return CheckResultStatus.VARIABLE_NOT_DEFINED;
			}
			else if (type == typeof(OxLocatorUndefined))
			{
				moreInfo = e.Message;
				return CheckResultStatus.UNKNOWN_PAGE_OBJECT;
			}
			else if (type == typeof(OxCommandNotImplementedException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.COMMAND_NOT_IMPLEMENTED;
			}
			else if (type == typeof(OxOperationException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.INVALID_OPERATION;
			}
			else if (type == typeof(OxXMLExtractException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.XML_ERROR;
			}
			else if (type == typeof(OxXMLtoJSONConvertException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.XML_ERROR;
			}
			else if (type == typeof(NoAlertPresentException))
				return CheckResultStatus.NO_ALERT_PRESENT;
			else if (type == typeof(OxBrowserJSExecutionException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.BROWSER_JS_EXECUTE_ERROR;
			}
			else if (type == typeof(OxDuplicateTransactionException))
			{
				moreInfo = e.Message;
				return CheckResultStatus.DUPLICATE_TRANSACTION;
			}
			else
			{
				log.Error("Unknown exception. Needs checking!!!", e);
				moreInfo = e.Message;
				return CheckResultStatus.UNKNOWN_ERROR;
			}
		}

		#endregion


		
	}
}
