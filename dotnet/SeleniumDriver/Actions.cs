using Newtonsoft.Json;
using OpenQA.Selenium;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Automation;

namespace CloudBeat.Oxygen
{
    public partial class SeleniumDriver
    {
        public void SeCmdSetTimeout(int timeout)
        {
            pageLoadTimeout = waitForTimeout = asynScriptTimeout = timeout;
            base.Manage().Timeouts().SetPageLoadTimeout(TimeSpan.FromMilliseconds(pageLoadTimeout));
            base.Manage().Timeouts().SetScriptTimeout(TimeSpan.FromMilliseconds(asynScriptTimeout));
        }
		public void SeCmdSetBaseUrl(string url)
		{
			this.BaseURL = url;
		}

        // implicit *AndWait assumed
        public void SeCmdOpen(string url)
        {
            string urlFinal;

            if (BaseURL == null)
                urlFinal = url;
            else if (BaseURL.EndsWith("/") && url == "/")
                urlFinal = BaseURL;
            else if (url.StartsWith("http:") || url.StartsWith("https:"))
                urlFinal = url;
            else
                urlFinal = BaseURL + url;

            this.Navigate().GoToUrl(urlFinal);
        }

        public void SeCmdPoint(string locator)
        {
            bool success = false;
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this.SeCmdWaitForVisible(locator);
                    Actions actions = new Actions(this);
                    actions.MoveToElement(this.FindElement(ResolveLocator(locator))).Perform();
                    success = true;
                    break;
                }
                catch (StaleElementReferenceException)
                {
                    Thread.Sleep(500);
                }
            }

            if (!success)
                throw new StaleElementReferenceException();
        }

        // Works with Chrome and Windows only
        public void SeCmdFileBrowse(string filepath)
        {
            // find Open dialog. try for up to 5 seconds
            int i = 0;
            AutomationElement openDialog;
            do
            {
                openDialog = AutomationElement.RootElement.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.NameProperty, "Open"));
                ++i;
                Thread.Sleep(100);
            }
            while (openDialog == null && i < 50);

            if (openDialog == null)
                throw new OxUnknownException("Cannot find Open dialog");

            // set file path
            var pathEdit = openDialog.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.AutomationIdProperty, "1148"));
            if (pathEdit == null)
                throw new OxUnknownException("Cannot find file path edit field");

            pathEdit.SetFocus();

            object valuePattern = null;
            pathEdit.TryGetCurrentPattern(ValuePattern.Pattern, out valuePattern);
            ((ValuePattern)valuePattern).SetValue(filepath);

            // click Open button
            var openBtn = openDialog.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.NameProperty, "Open"));
            if (openBtn == null)
                throw new OxUnknownException("Cannot find open button");

            var invokerPattern = openBtn.GetCurrentPattern(InvokePattern.Pattern) as InvokePattern;
            invokerPattern.Invoke();
        }

        public void SeCmdScrollToElement(string locator, int yOffset = 0)
        {
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var el = this.FindElement(ResolveLocator(locator));
                    (this as IJavaScriptExecutor).ExecuteScript("window.scrollTo(" + el.Location.X + "," + (el.Location.Y + yOffset) + ");");
                    break;
                }
                catch (StaleElementReferenceException)
                {
                    Thread.Sleep(500);
                }
            }
        }

        private int windowsCount;
        public void SeCmdClick(string locator)
        {
            windowsCount = base.WindowHandles.Count();

            this.SeCmdWaitForVisible(locator);

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                Exception lastException = null;
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            this.FindElement(ResolveLocator(locator)).Click();
                            return true;
                        }
                        catch (NoSuchElementException nsee)
                        {
                            lastException = nsee;
                        }
                        catch (InvalidOperationException ioe)
                        {
                            lastException = ioe;
                            if (ioe.Message == null || !ioe.Message.Contains("Element is not clickable at point"))
                                throw new OxOperationException(ioe.Message, ioe);
                        }
                        catch (Exception e)
                        {
                            lastException = e;
                        }
                        return false;
                    });
                }
                catch (StaleElementReferenceException) 
                {
                    Thread.Sleep(500);              // FIXME: should find a better way to delay retries
                    continue;
                }
                catch (WebDriverTimeoutException)
                {
                    if (lastException is NoSuchElementException)
                        throw new OxElementNotFoundException();
                    else if (lastException is OxOperationException) // not clickable
                        throw new OxOperationException(lastException.Message, lastException);
                    else if (lastException != null)
                        throw new OxUnknownException(lastException.Message, lastException);
                    else
                        throw new OxUnknownException();
                }

                return;
            }

            throw new StaleElementReferenceException();
        }

        public void SeCmdClickHidden(string locator)
        {
            windowsCount = base.WindowHandles.Count();

            bool success = false;
            // since FindElement and Click is not an atomic operation, there could be a race condition when we get the element but some javascript changes it before Display.Get
            // in which case a StaleElementReference exception is thrown.
            // we try to resolve this by refetching the element up to STALE_ELEMENT_ATTEMPTS times 
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this.SeCmdWaitForElementPresent(locator);
                    var el = this.FindElement(ResolveLocator(locator));
                    (this as IJavaScriptExecutor).ExecuteScript("var clck_ev = document.createEvent('MouseEvent');clck_ev.initEvent('click', true, true);arguments[0].dispatchEvent(clck_ev)", el);
                    success = true;
                    break;
                }
                catch (StaleElementReferenceException)
                {
                    Thread.Sleep(500);              // FIXME: should find a better way to delay retries
                }
                catch (InvalidOperationException ioe)
                {
                    throw new OxOperationException(ioe.Message, ioe);
                }
            }

            if (!success)
                throw new StaleElementReferenceException();
        }

        public void SeCmdDoubleClick(string locator)
        {
            bool success = false;
            // since FindElement.Displayed is not an atomic operation, there could be a race condition when we get the element but some javascript changes it before Display.Get
            // in which case a StaleElementReference exception is thrown.
            // we try to resolve this by refetching the element up to STALE_ELEMENT_ATTEMPTS times 
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
					// make sure that the element present first
                    this.SeCmdWaitForVisible(locator);

                    var el = this.FindElement(ResolveLocator(locator));

                    Actions actionProvider = new Actions(this);
                    IAction dblClick = actionProvider.DoubleClick(el).Build();
                    dblClick.Perform();

                    success = true;
                    break;
                }
                catch (StaleElementReferenceException) { }
                catch (InvalidOperationException ioe)
                {
                    throw new OxOperationException(ioe.Message, ioe);
                }
            }

            if (!success)
                throw new StaleElementReferenceException();
        }

        // not exposed through web module
        public void SeCmdSendKeys(string locator, string value)
        {
            var loc = ResolveLocator(locator);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
					// make sure that the element present first
                    this.SeCmdWaitForVisible(locator);

                    this.FindElement(loc).SendKeys(value);
                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        public void SeCmdClear(string locator)
        {
            var loc = ResolveLocator(locator);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this.SeCmdWaitForVisible(locator);
                    this.FindElement(loc).Clear();
                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        public void SeCmdType(string locator, string value)
        {
            var loc = ResolveLocator(locator);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
					// make sure that the element present first
                    this.SeCmdWaitForVisible(locator);

                    var el = this.FindElement(loc);

                    if (el.Displayed) 
                    {
                        el.Clear();
                        el.SendKeys(value);
                        // FIXME: sometimes only part of the value is sent (reproducible in IDE, yes script) 
                        //        and this awfull hack seems to fix it.
                        Thread.Sleep(800);
                    }
                    else
                        (this as IJavaScriptExecutor).ExecuteScript("arguments[0].value='" + value + "'", el); // it's ok to just set the value since 'type' not supposed to send keys anyway

                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        // NOTE: doesn't support pattern matching for label= and value= locators and does exact match instead.
        public void SeCmdSelect(string selectLocator, string optionLocator)
        {
            string selArg;
            string selectorMethod = "Select" + ParseSelector(optionLocator, out selArg);
			// make sure that the element present first
            this.SeCmdWaitForVisible(selectLocator);

            try
            {
                SelectElement sel = new SelectElement(this.FindElement(ResolveLocator(selectLocator)));
                Type type = typeof(SelectElement);
                MethodInfo cmdMethod = type.GetMethod(selectorMethod, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
                cmdMethod.Invoke(sel, new object[] { selArg });
            }
            catch (TargetInvocationException tie)
            {
                Exception e = tie.InnerException;
                if (e != null)
                {
                    if (e is NoSuchElementException)
                        throw new OxElementNotFoundException(e.Message);
                }
                throw tie;
            }
        }

        public void SeCmdDeselect(string selectLocator, string optionLocator)
        {
            string selArg;
            string selectorMethod = "Deselect" + ParseSelector(optionLocator, out selArg);
            // make sure that the element present first
            this.SeCmdWaitForVisible(selectLocator);

            try
            {
                SelectElement sel = new SelectElement(this.FindElement(ResolveLocator(selectLocator)));
                Type type = typeof(SelectElement);
                MethodInfo cmdMethod = type.GetMethod(selectorMethod, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
                cmdMethod.Invoke(sel, new object[] { selArg });
            }
            catch (TargetInvocationException tie)
            {
                Exception e = tie.InnerException;
                if (e != null)
                {
                    if (e is NoSuchElementException)
                        throw new OxElementNotFoundException(e.Message);
                }
                throw tie;
            }
        }

        public void SeCmdPause(int waitTime)
        {
            Thread.Sleep(waitTime);
        }

        public void SeCmdWaitForWindow(string windowLocator, int timeout)
        {
            if (string.IsNullOrWhiteSpace(windowLocator))  // wait for any new window
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(timeout)).Until((d) =>
                {
                    try
                    {
                        return windowsCount < base.WindowHandles.Count();
                    }
                    catch (NoSuchWindowException) { }

                    return false;
                });
            }
            else if (windowLocator.StartsWith("title="))   // wait for a window with the specified Title
            {
                string curWinHandle = null;
                try
                {
                    curWinHandle = base.CurrentWindowHandle;
                }
                catch (NoSuchWindowException)
                {
                    // if window was closed there is no current handle
                }

                string title = Regex.Replace(windowLocator.Substring("title=".Length).Trim(), @"\s+", " ");

                new WebDriverWait(this, TimeSpan.FromMilliseconds(timeout)).Until((d) =>
                {
                    try
                    {
                        foreach (string handle in base.WindowHandles)
                        {
                            var curWinTitle = base.SwitchTo().Window(handle).Title;
                            if (MatchPattern(curWinTitle, title))
                            {
                                if (curWinHandle != null)
                                    base.SwitchTo().Window(curWinHandle);
                                return true;
                            }
                        }
                        if (curWinHandle != null)
                            base.SwitchTo().Window(curWinHandle);
                        return false;
                    }
                    catch (NoSuchWindowException) 
                    {
                        return false;
                    }
                });
            }
            else
            {
                throw new OxCommandNotImplementedException("Unsuported locator - " + windowLocator);
            }
        }

        public string SeCmdSelectWindow(string windowLocator)
        {
            // FIXME: should use timeout provided as argument once support for optional paramteres is implemented
            SeCmdWaitForWindow(windowLocator, waitForTimeout);

            string curWinHandle = null;
            try
            {
                curWinHandle = base.CurrentWindowHandle;
            }
            catch (NoSuchWindowException)
            {
                // window was closed. return null in such case.
            }

            if (string.IsNullOrWhiteSpace(windowLocator))  // switch to the last opened window
            {
                base.SwitchTo().Window(base.WindowHandles.Last());
                return curWinHandle;
            }
            else if (windowLocator.StartsWith("title="))   // switch to the first window with a matching title
            {
                string pattern = Regex.Replace(windowLocator.Substring("title=".Length).Trim(), @"\s+", " ");

                foreach (string handle in base.WindowHandles)
                {
                    var curWinTitle = base.SwitchTo().Window(handle).Title;
                    if (MatchPattern(curWinTitle, pattern))
                        return curWinHandle;
                }

                throw new Exception("selectWindow cannot find window using locator '" + windowLocator + "'");
            }
            else                                    // switch to the first window with a matching title
            {
                base.SwitchTo().Window(windowLocator);
                return curWinHandle;
            }
        }

        public void SeCmdSelectFrame(string frameLocator)
        {
            if (frameLocator.StartsWith("index="))
            {
                int index = int.Parse(frameLocator.Substring("index=".Length));
                SwitchTo().Frame(index);
            }
            else if (frameLocator == "relative=parent" || frameLocator == "relative=up")
            {
                SwitchTo().ParentFrame();
            }
            else if (frameLocator == "relative=top")
            {
                SwitchTo().DefaultContent();
            }
            else if (frameLocator.StartsWith("dom="))
            {
                throw new OxCommandNotImplementedException("'dom=' locator in SelectFrame is not supported");
            }
            else if (frameLocator.StartsWith("//"))   // non Selenium RC compliant
            {
                var frames = frameLocator.Split(new[] {";;"}, StringSplitOptions.RemoveEmptyEntries);
                // switch to parent window
                SwitchTo().DefaultContent();
                // descend into frames
                foreach (var frame in frames) 
                {
                    this.SeCmdWaitForElementPresent(frame);
                    var el = this.FindElement(By.XPath(frame));
                    SwitchTo().Frame(el);
                }
            }
            else
            {
                SwitchTo().Frame(frameLocator);
            }
        }

        public void SeCmdCloseWindow()
        {
            this.Close();
        }

        public void SeCmdAlertAccept()
        {
            base.SwitchTo().Alert().Accept();
        }

        public void SeCmdAlertDismiss()
        {
            base.SwitchTo().Alert().Dismiss();
        }

        public string SeCmdExecuteScript(string script)
        {
            object result;

            try
            {
                result = this.ExecuteScript(script);
            }
            catch (InvalidOperationException ioe)
            {
                throw new OxBrowserJSExecutionException(ioe.Message, ioe);
            }

            // IWebElement instances can't be serialized so we return null instead
            if (result is IWebElement || result is ReadOnlyCollection<IWebElement>)
                return null;

            return JsonConvert.SerializeObject(result);
        }

        public void SeCmdMakeVisible(string locator)
        {
            bool success = false;

            var loc = ResolveLocator(locator);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var el = this.FindElement(loc);
                    (this as IJavaScriptExecutor).ExecuteScript("arguments[0].style.visibility='visible';arguments[0].style.height='1px';arguments[0].style.width='1px';arguments[0].style.opacity=1;arguments[0].style.display='block';", el);
                    success = true;
                    return;
                }
                catch (StaleElementReferenceException) { }
            }

            if (!success)
                throw new StaleElementReferenceException();
        }
    }
}
