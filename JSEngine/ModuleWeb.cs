using System;
using System.Diagnostics;

namespace CloudBeat.Selenium.JSEngine
{
    public class ModuleWeb
	{
        private SeleniumDriver cmdProc;

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

        public ModuleWeb(bool fetchStats, bool screenShotErrors)
        {
            this.screenShotErrors = screenShotErrors;
            this.fetchStats = fetchStats;
        }

        public void SetCmdProcessor(SeleniumDriver cmdProc)
        {
            this.cmdProc = cmdProc;
        }

        public void DisposeCmdProcessor()
        {
            try
            {
                if (cmdProc != null)
                    cmdProc.Close();
            }
            catch (Exception) { } // ignore exceptions
        }

        [JSVisible]
        public void setBaseUrl(string url)
        {
            if (CommandExecuting != null)
                CommandExecuting();
            cmdProc.BaseURL = url;
        }
        [JSVisible]
        public void transaction(string name)
        {
            if (TransactionUpdate != null)
            {
                cmdProc.StartNewTransaction(name);
                TransactionUpdate(name);
            }
        }
        [JSVisible]
        public void setTimeout(string timeout)
        {
            Exec(timeout, null);
        }
        [JSVisible]
        public void open(string url)
        {
            openAndWait(url);
        }
        [JSVisible]
        public void openAndWait(string url)
        {
            Exec(url, null);
        }
        [JSVisible]
        public void point(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
		public void click(string locator)
		{
            clickAndWait(locator);
		}
        [JSVisible]
        public void clickHidden(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void clickAndWait(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void assertTitle(string pattern)
        {
            Exec(pattern, null);
        }
        [JSVisible]
        public void type(string locator, string value)
        {
            Exec(locator, value);
        }
        [JSVisible]
        public void clear(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void assertText(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void selectWindow(string windowID)
        {
            Exec(windowID, null);
        }
        [JSVisible]
        public void store(string expression, string variableName)
        {
            storeExpression(expression, variableName);
        }
        [JSVisible]
        public void storeExpression(string expression, string variableName)
        {
            Exec(expression, variableName);
        }
        [JSVisible]
        public void storeText(string locator, string variableName)
        {
            Exec(locator, variableName);
        }
        [JSVisible]
        public void storeValue(string locator, string variableName)
        {
            Exec(locator, variableName);
        }
        [JSVisible]
        public void doubleClick(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void sendKeys(string locator, string value)
        {
            Exec(locator, value);
        }
        [JSVisible]
        public void select(string selectLocator, string optionLocator)
        {
            Exec(selectLocator, optionLocator);
        }
        [JSVisible]
        public void pause(string waitTime)
        {
            Exec(waitTime, null);
        }
        [JSVisible]
        public void waitForPopUp(string windowID, string timeout)
        {
            Exec(windowID, timeout);
        }
        [JSVisible]
        public void selectFrame(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void waitForVisible(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void waitForAllLinks(string pattern)
        {
            Exec(pattern, null);
        }
        [JSVisible]
        public void waitForElementPresent(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void waitForText(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void waitForNotText(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void waitForValue(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void waitForNotValue(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void assertValue(string locator, string pattern)
        {
            Exec(locator, pattern);
        }
        [JSVisible]
        public void assertTextPresent(string pattern)
        {
            Exec(pattern, null);
        }
        [JSVisible]
        public void assertElementPresent(string locator)
        {
            Exec(locator, null);
        }
        [JSVisible]
        public void assertAlert(string pattern)
        {
            Exec(pattern, null);
        }
        [JSVisible]
        public void waitForPageToLoad(string timeout)
        {
            Exec(timeout, null);
        }

        private void Exec(string target, string value)
        {
            if (CommandExecuting != null)
                CommandExecuting();

            // execute the command
            string screenShot = null;
            var cmd = new SeCommand
            {
                CommandName = new StackTrace().GetFrame(1).GetMethod().Name,
                Target = target,
                Value = value
            };

            try
            {
                cmdProc.ExecuteCommand(cmd, screenShotErrors, out screenShot);

                if (CommandExecuted != null)
                {
                    int domContentLoaded = 0;
                    int load = 0;

                    if (fetchStats)
                    {
                        long navigationStart = 0;

                        if (cmd.IsAction())
                        {
                            if (cmdProc.GetPerformanceTimings(out domContentLoaded, out load, out navigationStart))
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
            }
            catch (Exception e)
            {
                if (CommandException != null)
                    CommandException(cmd, screenShot, e);
                else
                    throw;
            }
        }
	}
}
