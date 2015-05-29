using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
    public class DCChrome : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
			var dc = DesiredCapabilities.Chrome();
			ChromeOptions options = new ChromeOptions();
            // in Chrome 39+ SSLv3 fallback is disabled. we need to enable it back.
            // https://groups.google.com/a/chromium.org/forum/#!topic/security-dev/Vnhy9aKM_l4
            options.AddArgument("ssl-version-fallback-min=ssl3");
			return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
