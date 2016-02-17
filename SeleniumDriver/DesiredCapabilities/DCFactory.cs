using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
    public static class DCFactory
    {
        public static DesiredCapabilities Get(string browser, string chromeBinary = null)
        {
            switch (browser.ToLower())
            {
                case "chrome":
                    return new DCChrome().Create(new Capabilities() { ChromeBinary = chromeBinary });
                case "firefox":
                    return new DCFirefox().Create(null);
				case "ie":
					return new DCInternetExplorer().Create(null);
                default:
                    return null;
            }
        }
    }
}
