/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Linq;

namespace CloudBeat.Oxygen.Modules
{
    public partial class SeleniumDriver
    {
        public void _WaitForVisible(string locator)
        {
            bool elementPresent = false;
            UnhandledAlertException alert = null;

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            var el = this.FindElement(ResolveLocator(locator));
                            elementPresent = true;
                            if (el.Displayed)
                                return true;
                        }
                        catch (NoSuchElementException)
                        {
                            elementPresent = false;
                        }
                        catch (UnhandledAlertException uae)
                        {
                            alert = uae;
                            return true;
                        }
                        return false;
                    });

                    if (alert != null)
                        throw alert;
                    return;
                }
                catch (StaleElementReferenceException) { }
                catch (WebDriverTimeoutException)
                {
                    if (elementPresent)
                        throw new OxElementNotVisibleException();
                    else
                        throw new OxElementNotFoundException();
                }
            }

            throw new StaleElementReferenceException();
        }

        public void _WaitForElementPresent(string locator)
        {
            UnhandledAlertException alert = null;
            try
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                {
                    try
                    {
                        var el = this.FindElement(ResolveLocator(locator));
                        return el != null;
                    }
                    catch (NoSuchElementException)
                    {

                    }
                    catch (UnhandledAlertException uae)
                    {
                        alert = uae;
                        return true;
                    }

                    return false;
                });

                if (alert != null)
                    throw alert;
                return;
            }
            catch (WebDriverTimeoutException)
            {
                throw new OxElementNotFoundException();
            }
        }

        public void _WaitForText(string locator, string pattern)
        {
            string valCleaned = CollapseWhitespace(pattern);
            bool elementPresent = false;
            UnhandledAlertException alert = null;

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            var el = this.FindElement(ResolveLocator(locator));
                            elementPresent = true;
                            return MatchPattern(el.Text, valCleaned);
                        }
                        catch (NoSuchElementException) 
                        {
                            elementPresent = false;
                        }
                        catch (UnhandledAlertException uae)
                        {
                            alert = uae;
                            return true;
                        }

                        return false;
                    });

                    if (alert != null)
                        throw alert;
                    return;
                }
                catch (StaleElementReferenceException) { }
                catch (WebDriverTimeoutException)
                {
                    if (elementPresent) 
                        throw new OxWaitForException("Element's text doesn't match.");
                    else
                        throw new OxElementNotFoundException();
                }
            }

            throw new StaleElementReferenceException();
        }

        public void _WaitForNotText(string locator, string pattern)
        {
            string valCleaned = CollapseWhitespace(pattern);
            bool elementPresent = false;
            UnhandledAlertException alert = null;

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            var el = this.FindElement(ResolveLocator(locator));
                            elementPresent = true;
                            return !MatchPattern(el.Text, valCleaned);
                        }
                        catch (NoSuchElementException)
                        {
                            elementPresent = false;
                        }
                        catch (UnhandledAlertException uae)
                        {
                            alert = uae;
                            return true;
                        }
                        return false;
                    });

                    if (alert != null)
                        throw alert;
                    return;
                }
                catch (StaleElementReferenceException) { }
                catch (WebDriverTimeoutException)
                {
                    if (elementPresent)
                        throw new OxWaitForException("Element's text does not not match.");
                    else
                        throw new OxElementNotFoundException();
                }
            }

            throw new StaleElementReferenceException();
        }

        public void _AssertValue(string locator, string pattern)
        {
            this._WaitForVisible(locator);
            // assertValue asserts the value of an input field (or anything else with a value parameter). 
            // For checkbox/radio elements, the value will be "on" or "off" depending on whether the element is checked or not.
            // hence we need to take two different approaches when comparing depending if the element is radio/checkbox or something else

            var el = this.FindElement(ResolveLocator(locator));

            var type = el.GetAttribute("type");
            if (type == null)
                throw new OxElementHasNoValueException(locator);

            type = type.Trim().ToLower();

            if (type == "radio" || type == "checkbox")
            {
                if (el.Selected && pattern == "off" || !el.Selected && pattern == "on")
                    throw new OxAssertionException();
            }
            else
            {
                var elValue = el.GetAttribute("value");
                if (elValue == null)
                    throw new OxElementHasNoValueException(locator);

                if (!MatchPattern(elValue, pattern))
                    throw new OxAssertionException();
            }
        }

        public void _WaitForValue(string locator, string pattern)
        {
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            var el = this.FindElement(ResolveLocator(locator));
                            var type = el.GetAttribute("type");
                            if (type == null)
                                throw new OxElementHasNoValueException(locator);
                            type = type.Trim().ToLower();

                            var elValue = el.GetAttribute("value");
                            if (elValue == null)
                                throw new OxElementHasNoValueException(locator);

                            // waitForValue wait for a value of an input field (or anything else with a value parameter) to become equal to the provided value. 
                            // For checkbox/radio elements, the value will be "on" or "off" depending on whether the element is checked or not.
                            // hence we need to take two different approaches when comparing depending if the element is radio/checkbox or something else
                            if (type == "radio" || type == "checkbox")
                                return (el.Selected && pattern == "off" || !el.Selected && pattern == "on");
                            else
                                return MatchPattern(pattern, CollapseWhitespace(elValue));
                        }
                        catch (NoSuchElementException) { }

                        return false;
                    });

                    return;
                }
                catch (StaleElementReferenceException) { }
                catch (WebDriverTimeoutException)
                {
                    throw new OxWaitForException();
                }
            }
            throw new StaleElementReferenceException();
        }

        public void _WaitForNotValue(string locator, string pattern)
        {
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                    {
                        try
                        {
                            var el = this.FindElement(ResolveLocator(locator));
                            var type = el.GetAttribute("type");
                            if (type == null)
                                throw new OxElementHasNoValueException(locator);
                            type = type.Trim().ToLower();

                            var elValue = el.GetAttribute("value");
                            if (elValue == null)
                                throw new OxElementHasNoValueException(locator);

                            // waitForValue wait for a value of an input field (or anything else with a value parameter) to become equal to the provided value. 
                            // For checkbox/radio elements, the value will be "on" or "off" depending on whether the element is checked or not.
                            // hence we need to take two different approaches when comparing depending if the element is radio/checkbox or something else
                            if (type == "radio" || type == "checkbox")
                                return !(el.Selected && pattern == "off" || !el.Selected && pattern == "on");
                            else
                                return !MatchPattern(pattern, CollapseWhitespace(elValue));
                        }
                        catch (NoSuchElementException) { }

                        return false;
                    });

                    return;
                }
                catch (StaleElementReferenceException) { }
                catch (WebDriverTimeoutException)
                {
                    throw new OxWaitForException();
                }
            }
            throw new StaleElementReferenceException();
        }

        public void _AssertText(string locator, string pattern)
        {
            string text = null;

            bool success = false;
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this._WaitForVisible(locator);
                    text = this.FindElement(ResolveLocator(locator)).Text;
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

            if (!MatchPattern(text, pattern))
                throw new OxAssertionException();
        }

        public void _AssertTextPresent(string text)
        {
            var els = this.FindElements(By.XPath("//*[contains(text(),'" + text + "')]"));
            if (els.Count() == 0)
                throw new OxAssertionException();
        }

        public void _AssertElementPresent(string locator)
        {
            try
            {
                this._WaitForElementPresent(locator);
            }
            catch (OxElementNotFoundException)
            {
                throw new OxAssertionException();
            }
        }

        public void _AssertAlert(string pattern)
        {
            new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
            {
                try
                {
                    var alert = base.SwitchTo().Alert();
                    if (!MatchPattern(alert.Text, pattern))
                        throw new OxAssertionException();
                    alert.Accept();
                    return true;
                }
                catch (NoAlertPresentException) { }

                return false;
            });
        }

        public void _AssertTitle(string pattern)
        {
            try
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(waitForTimeout)).Until((d) =>
                {
                    return MatchPattern(d.Title, pattern);
                });
            }
            catch (WebDriverTimeoutException)
            {
                throw new OxAssertionException();
            }
        }

        public bool _IsElementPresent(string locator, int timeout)
        {
            try
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(timeout)).Until((d) =>
                {
                    try
                    {
                        var el = this.FindElement(ResolveLocator(locator));
                        return el != null;
                    }
                    catch (NoSuchElementException) { }

                    return false;
                });

                return true;
            }
            catch (WebDriverTimeoutException)
            {
                return false;
            }
        }

        public bool _IsElementVisible(string locator, int timeout)
        {
            try
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(timeout)).Until((d) =>
                {
                    try
                    {
                        var el = this.FindElement(ResolveLocator(locator));
                        return el.Displayed;
                    }
                    catch (NoSuchElementException) { }

                    return false;
                });

                return true;
            }
            catch (WebDriverTimeoutException)
            {
                return false;
            }
        }

        public bool _IsAlertPresent(string text, int timeout)
        {
            try
            {
                new WebDriverWait(this, TimeSpan.FromMilliseconds(timeout)).Until((d) =>
                {
                    try
                    {
                        var alert = base.SwitchTo().Alert();
                        return MatchPattern(alert.Text, text);
                    }
                    catch (NoAlertPresentException)
                    {
                        return false;
                    }
                });

                return true;
            }
            catch (WebDriverTimeoutException)
            {
                return false;
            }
        }

        public void _AssertSelectedLabel(string locator, string pattern)
        {
            string text = null;

            bool success = false;
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this._WaitForVisible(locator);

                    var el = new SelectElement(this.FindElement(ResolveLocator(locator)));
                    text = el.SelectedOption.Text;

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

            if (!MatchPattern(text, pattern))
                throw new OxAssertionException();
        }

        public void _AssertSelectedValue(string locator, string pattern)
        {
            string text = null;

            bool success = false;
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    this._WaitForVisible(locator);

                    var el = new SelectElement(this.FindElement(ResolveLocator(locator)));
                    text = el.SelectedOption.GetAttribute("value");

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

            if (!MatchPattern(text, pattern))
                throw new OxAssertionException();
        }
    }
}
