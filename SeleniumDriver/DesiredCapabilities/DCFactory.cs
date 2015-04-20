using OpenQA.Selenium.Remote;

namespace CloudBeat.Selenium
{
    public static class DCFactory
    {
        public static DesiredCapabilities Get(string browser)
        {
            switch (browser.ToLower())
            {
                case "chrome":
                    return new DCChrome().Create();
                case "firefox":
                    return new DCFirefox().Create();
				case "ie":
					return new DCInternetExplorer().Create();
                default:
                    return null;
            }
        }
    }
}
