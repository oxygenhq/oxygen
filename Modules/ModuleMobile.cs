using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;

namespace CloudBeat.Oxygen.JSEngine
{
    /*public class ModuleMobile
	{
        private AndroidDriver<AndroidElement> driver;

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

        public ModuleMobile(bool fetchStats, bool screenShotErrors)
        {
            this.screenShotErrors = screenShotErrors;
            this.fetchStats = fetchStats;
        }

        public void SetDriver(AndroidDriver<AndroidElement> driver)
        {
			this.driver = driver;
        }

        public void DisposeDriver()
        {
            try
            {
                if (driver != null)
                    driver.Quit();
            }
            catch (Exception) { } // ignore exceptions
        }

         private HashSet<string> transactions = new HashSet<string>();
        [JSVisible]
       public void transaction(string name)
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
		[JSVisible]
		public void init(string platform, string appPackage, string appActivity)
		{
			DesiredCapabilities capabilities = new DesiredCapabilities();
			capabilities.SetCapability("deviceName", "Android Emulator");
			capabilities.SetCapability("platformName", platform);       // Android
			capabilities.SetCapability("appPackage", appPackage);       // "il.co.yes.yesgo
			capabilities.SetCapability("appActivity", appActivity);     // com.tvinci.yes.InitActivity
			capabilities.SetCapability("appWaitActivity", null);
			capabilities.SetCapability("ignoreUnimportantViews", true);
			this.driver = new AndroidDriver<AndroidElement>(new Uri("http://127.0.0.1:4723/wd/hub"), capabilities);
		}
		[JSVisible]
        public void swipe(int startx, int starty, int endx, int endy, int duration)
        {
            driver.Swipe(startx, starty, endx, endy, duration);
        }
        [JSVisible]
        public void click(string locator, int wait, int pollrate)
        {
            var wdg = new WebDriverWait(new SystemClock(), driver, TimeSpan.FromSeconds(wait), TimeSpan.FromSeconds(pollrate))
                .Until(d => d.FindElement(GetBy(locator)));
            wdg.Click();
        }
        [JSVisible]
        public void wait(string locator, int wait, int pollrate)
        {
            new WebDriverWait(new SystemClock(), driver, TimeSpan.FromSeconds(wait), TimeSpan.FromSeconds(pollrate))
                .Until(d => d.FindElement(GetBy(locator)));
        }
		[JSVisible]
		public void pause(float seconds)
		{
			Thread.Sleep((int)(seconds * 1000));
		}

        private By GetBy(string locator)
        {
            if (locator.StartsWith("id="))
                return By.Id(locator.Substring(3));
            else if (locator.StartsWith("//"))
                return By.XPath(locator);

            return null;
        }

        private object Exec(params object[] args)
        {
            if (CommandExecuting != null)
                CommandExecuting();

            // execute the command
            string screenShot = null;

            var name = new StackTrace().GetFrame(1).GetMethod().Name;
            // when used from within the Jurassic wrapper with optimization turned on 
            // the name will be "binder_for_CloudBeat.Oxygen.JSEngine.ModuleWebJurassic.CMD"
            if (name.StartsWith("binder_for"))
                name = name.Substring(name.LastIndexOf('.') + 1);

            var cmd = new SeCommand
            {
                CommandName = name,
                Arguments = args
            };

            try
            {
                var retVal = driver.ExecuteCommand(cmd, screenShotErrors, out screenShot);

                if (CommandExecuted != null)
                {
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
                        }
                    }

                    CommandExecuted(cmd, domContentLoaded, load);
                }

                return retVal;
            }
            catch (Exception e)
            {
                if (CommandException != null)
                    CommandException(cmd, screenShot, e);
                else
                    throw;
            }

            return null;
        }
	}*/
}
