using OpenQA.Selenium;

namespace CloudBeat.Selenium
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
                        throw new SeElementHasNoValueException("Element '" + target + "' has no value; is it really a form field?");
                    
                    type = type.Trim().ToLower();

                    if (type == "radio" || type == "checkbox")
                    {
                        variables.Add(value.Trim(), el.Selected ? "on" : "off");
                    }
                    else
                    {
                        var elValue = el.GetAttribute("value");
                        if (elValue == null)
                            throw new SeElementHasNoValueException("Element '" + target + "' has no value; is it really a form field?");

                        variables.Add(value.Trim(), elValue);
                    }

                    return;
                }
                catch (StaleElementReferenceException) { }
            }
        }
    }
}
