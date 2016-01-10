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
using System.Threading;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleWeb : IModule
	{
		private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private SeleniumDriver driver;

        public delegate void TransactionEventHandler(string transaction);
        public event TransactionEventHandler TransactionUpdate;

        public delegate void ExceptionEventHandler(SeCommand cmd, string screenShot, Exception e);
        public event ExceptionEventHandler CommandException;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        public delegate void ExecutedEventHandler(SeCommand cmd, int domContentLoaded, int load);
        public event ExecutedEventHandler CommandExecuted;

        private bool screenShotErrors;
        private bool fetchStats;
        private long prevNavigationStart = long.MinValue;
		private bool initialized = false;
		private string seleniumUrl;
		private string proxyUrl;
		private DesiredCapabilities capabilities;
		private ExecutionContext ctx;

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
		#endregion

		public ModuleWeb()
		{

		}
		public ModuleWeb(bool fetchStats, bool screenShotErrors)
        {
            this.screenShotErrors = screenShotErrors;
            this.fetchStats = fetchStats;
        }

		#region General Public Functions
		public void SetDriver(SeleniumDriver driver)
        {
			this.driver = driver;
        }
		public void IterationStarted()
		{

		}
		public void IterationEnded()
		{

		}
		public bool Initialize(Dictionary<string, string> args, ExecutionContext ctx)
		{
			this.ctx = ctx;

			if (args.ContainsKey(ARG_PROXY_URL))
				proxyUrl = args[ARG_PROXY_URL];
			if (args.ContainsKey(ARG_SELENIUM_URL))
				seleniumUrl = args[ARG_SELENIUM_URL];
			else
				throw new ArgumentNullException(ARG_SELENIUM_URL);
			bool initDriver = args.ContainsKey(ARG_INIT_DRIVER) && args[ARG_INIT_DRIVER] == "true";
			// initialize DesiredCapabilities with provided browser
			if (args.ContainsKey(ARG_BROWSER_NAME))
				capabilities = DCFactory.Get(args[ARG_BROWSER_NAME]);
			if (initDriver)
				InitializeSeleniumDriver();
			initialized = true;
			return true;
		}
		protected void InitializeSeleniumDriver()
		{
			BMPClient proxyClient = null;
			if (!string.IsNullOrEmpty(proxyUrl))
				proxyClient = ConnectToProxy(proxyUrl);
			if (capabilities == null)
				capabilities = DCFactory.Get(DEFAULT_BROWSER_NAME);
			try
			{
				driver = ConnectToSelenium(capabilities, proxyClient, seleniumUrl, ctx);
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
						connectAttempt++;
						continue;
					}

					log.Fatal("Error connecting to proxy", e);
					throw new Exception("Can't initialize proxy: " + e.Message);
				}
				break;
			} while (connectAttempt < PROXY_CONN_RETRY_COUNT);

			try
			{
				client.NewHar(true);
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
								log.Fatal("Giving up on SeCommandProcessor initialization", e);
								throw;
							}
							Thread.Sleep(1000);	// in case the failure was due to resources overload - wait a bit...
							continue;
						}
					}

					log.Fatal("Error initializing SeCommandProcessor", e);
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
						cmdProc.Manage().Window.Size = new System.Drawing.Size(BROWSER_W, BROWSER_H);
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
                    driver.Close();
            }
            catch (Exception) { } // ignore exceptions
			return true;
        }

		public bool IsInitialized { get { return initialized; } }

        public void SetBaseUrl(string url)
        {
            if (CommandExecuting != null)
                CommandExecuting();
            driver.BaseURL = url;
        }

		#endregion

		private HashSet<string> transactions = new HashSet<string>();

        public void Transaction(string name)
        {
            // throw in case we hit a duplicate transaction
            if (transactions.Contains(name))
            {
                var e = new OxDuplicateTransactionException("Duplicate transaction found: \"" + name + "\". Transactions must be unique.");
                if (CommandException != null)
                    CommandException(new SeCommand { 
                        CommandName = "transaction", 
                        Arguments = new object[] { name }
                    }, 
                    null, e);
            }
            transactions.Add(name);

            if (TransactionUpdate != null)
            {
                driver.StartNewTransaction(name);
                TransactionUpdate(name);
            }
        }

		#region Selenium Standard Commands Implementation

		public void Init(string browserName)
		{
			if (driver == null)
				throw new Exception("Selenium driver has been already initialized");
			
			capabilities = DCFactory.Get(browserName);
			InitializeSeleniumDriver();
		}
		public StepResult SetTimeout(int timeout)
        {
            return ExecuteSeleniumCommand(timeout);
        }
		public StepResult Open(string url)
        {
            return ExecuteSeleniumCommand(url);
        }

		public StepResult Point(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }

		public StepResult ScrollToElement(string locator, int yOffset)
        {
            return ExecuteSeleniumCommand(locator, yOffset.ToString());
        }

		public StepResult Click(string locator)
		{
            return ExecuteSeleniumCommand(locator);
		}
		public StepResult ClickHidden(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult AssertTitle(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public StepResult Type(string locator, string value)
        {
            return ExecuteSeleniumCommand(locator, value);
        }
		public StepResult Clear(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult AssertText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult SelectWindow(string windowLocator)
        {
            return ExecuteSeleniumCommand(windowLocator);
        }
		public StepResult GetText(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult GetAttribute(string locator, string attributeName)
        {
            return ExecuteSeleniumCommand(locator, attributeName);
        }
		public StepResult GetValue(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult DoubleClick(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult Select(string selectLocator, string optionLocator)
        {
            return ExecuteSeleniumCommand(selectLocator, optionLocator);
        }
		public StepResult Deselect(string selectLocator, string optionLocator)
        {
            return ExecuteSeleniumCommand(selectLocator, optionLocator);
        }
		public StepResult Pause(int waitTime)
        {
            return ExecuteSeleniumCommand(waitTime);
        }
		public StepResult WaitForPopUp(string windowID, int timeout)
        {
            return ExecuteSeleniumCommand(windowID, timeout);
        }
		public StepResult SelectFrame(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult WaitForVisible(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult WaitForElementPresent(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult IsElementPresent(string locator, int timeout)
        {
            return ExecuteSeleniumCommand(locator, timeout);
        }
		public StepResult IsElementVisible(string locator, int timeout)
        {
            return ExecuteSeleniumCommand(locator, timeout);
        }
		public StepResult WaitForText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult WaitForNotText(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult WaitForValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult WaitForNotValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult AssertValue(string locator, string pattern)
        {
            return ExecuteSeleniumCommand(locator, pattern);
        }
		public StepResult AssertTextPresent(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public StepResult AssertElementPresent(string locator)
        {
            return ExecuteSeleniumCommand(locator);
        }
		public StepResult AssertAlert(string pattern)
        {
            return ExecuteSeleniumCommand(pattern);
        }
		public StepResult GetPageSource()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult GetXMLPageSource()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult GetXMLPageSourceAsJSON()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult GetWindowHandles()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult CloseWindow()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult IsAlertPresent(string text, int timeout)
        {
            return ExecuteSeleniumCommand(text, timeout);
        }
		public StepResult AlertAccept()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult AlertDismiss()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult AssertSelectedLabel(string locator, string text)
        {
            return ExecuteSeleniumCommand(locator, text);
        }
		public StepResult AssertSelectedValue(string locator, string value)
        {
            return ExecuteSeleniumCommand(locator, value);
        }
		public StepResult GetAlertText()
        {
            return ExecuteSeleniumCommand();
        }
		public StepResult ExecuteScript(string script)
        {
            return ExecuteSeleniumCommand(script);
        }
		#endregion

		#region Internal Methods Implementation
		private StepResult ExecuteSeleniumCommand(params object[] args)
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
			var result = new StepResult()
			{
				CommandName = name
			};

            try
            {
				result.StartTime = DateTime.UtcNow;
                
				var retVal = driver.ExecuteCommand(cmd, screenShotErrors, out screenShot);
				
				result.EndTime = DateTime.UtcNow;
				result.IsAction = cmd.IsAction();
				result.Screenshot = screenShot;
				result.ReturnValue = retVal != null ? retVal.ToString() : null;
				result.IsSuccess = true;

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

                return result;
            }
            catch (Exception e)
            {
				result.EndTime = DateTime.UtcNow;
				result.IsAction = cmd.IsAction();
				result.IsSuccess = false;
				result.ErrorMessage = e.Message;
				result.ErrorDetails = e.StackTrace;
            }

            return result;
        }

		#endregion


		
	}
}
