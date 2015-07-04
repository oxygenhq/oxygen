using Newtonsoft.Json;
using OpenQA.Selenium;
using System;
using System.Text.RegularExpressions;
using System.Xml;

namespace CloudBeat.Oxygen
{
    public partial class SeleniumDriver
    {
        public void SeCmdStore(string target, string value)
        {
            SeCmdStoreExpression(target, value);
        }

        public void SeCmdStoreExpression(string target, string value)
        {
            variables.Add(value.Trim(), target);
        }

        public void SeCmdStoreAttribute(string target, string value)
        {
            string attributeName;
            var locator = ResolveAttributeLocator(target, out attributeName);

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var attribute = this.FindElement(locator).GetAttribute(attributeName);
                    variables.Add(value.Trim(), attribute);
                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        public void SeCmdStoreText(string target, string value)
        {
            var locator = ResolveLocator(target);

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var text = this.FindElement(locator).Text;
                    variables.Add(value.Trim(), text);
                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        public void SeCmdStoreValue(string target, string value)
        {
            var locator = ResolveLocator(target);

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var el = this.FindElement(locator);

                    var type = el.GetAttribute("type");
                    if (type == null)
                        throw new SeElementHasNoValueException(target);
                    
                    type = type.Trim().ToLower();

                    if (type == "radio" || type == "checkbox")
                    {
                        variables.Add(value.Trim(), el.Selected ? "on" : "off");
                    }
                    else
                    {
                        var elValue = el.GetAttribute("value");
                        if (elValue == null)
                            throw new SeElementHasNoValueException(target);

                        variables.Add(value.Trim(), elValue);
                    }

                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }

        public string SeCmdGetAttribute(string target, string value)
        {
            var locator = ResolveLocator(target);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    return this.FindElement(locator).GetAttribute(value);
                }
                catch (StaleElementReferenceException) { }
            }
            return null;
        }

        public string SeCmdGetText(string target, string value)
        {
            var locator = ResolveLocator(target);
            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    return this.FindElement(locator).Text;
                }
                catch (StaleElementReferenceException) { }
            }
            return null;
        }

        public string SeCmdGetValue(string target, string value)
        {
            var locator = ResolveLocator(target);

            for (int i = 0; i < STALE_ELEMENT_ATTEMPTS; i++)
            {
                try
                {
                    var el = this.FindElement(locator);

                    var type = el.GetAttribute("type");
                    if (type == null)
                        throw new SeElementHasNoValueException(target);

                    type = type.Trim().ToLower();

                    if (type == "radio" || type == "checkbox")
                    {
                        return el.Selected ? "on" : "off";
                    }
                    else
                    {
                        var elValue = el.GetAttribute("value");
                        if (elValue == null)
                            throw new SeElementHasNoValueException(target);
                        return elValue;
                    }
                }
                catch (StaleElementReferenceException) { }
            }
            return null;
        }

        public string SeCmdGetPageSource(string target, string value)
        {
            return this.PageSource;
        }

        public string SeCmdGetXMLPageSource(string target, string value)
        {
            switch (this.Capabilities.BrowserName)
            {
                case "chrome":
                    try
                    {
                        return this.ExecuteScript("return document.getElementById(\"webkit-xml-viewer-source-xml\").innerHTML;") as string;
                    }
                    catch (Exception)
                    {
                        throw new SeXMLExtractException("Unable to extract XML from: " + this.PageSource);
                    }
                case "internet explorer":
                    // TODO: optimize
                    var src = Regex.Replace(this.PageSource, @"<a\s*.*?>&lt;.*?<\/a>", "", RegexOptions.Multiline);
                    src = Regex.Replace(src, @"<style\s*.*?>.*?<\/style>", "", RegexOptions.Multiline);
                    src = Regex.Replace(src, @"<div\s*.*?>.*?<\/div>", "", RegexOptions.Multiline);
                    return Regex.Replace(src, @"<span\s*.*?>.*?<span\s*.*?>.*?<\/span>.*?<\/span>", "", RegexOptions.Multiline);
                case "firefox":
                default:
                    throw new SeXMLExtractException("This command is not supported on " + this.Capabilities.BrowserName + " yet.");
            }
        }

        public string SeCmdGetXMLPageSourceAsJSON(string target, string value)
        {
            var src = SeCmdGetXMLPageSource(null, null);
            try 
            {
                XmlDocument doc = new XmlDocument();
                doc.LoadXml(src);
                return JsonConvert.SerializeXmlNode(doc);
            }
            catch (Exception)
            {
                throw new SeXMLtoJSONConvertException("Unable to convert XML to JSON: " + this.PageSource);
            }
        }
    }
}
