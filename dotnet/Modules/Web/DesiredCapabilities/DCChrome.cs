using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen.Modules
{
    public class DCChrome : IDCBrowser
    {
        public DesiredCapabilities Create(Capabilities caps) 
        {
			//var dc = DesiredCapabilities.Chrome();
			ChromeOptions options = new ChromeOptions();
            // in Chrome 39+ SSLv3 fallback is disabled. we need to enable it back.
            // https://groups.google.com/a/chromium.org/forum/#!topic/security-dev/Vnhy9aKM_l4
            options.AddArgument("ssl-version-fallback-min=ssl3");
            if (caps != null && caps.ChromeBinary != null)
                options.BinaryLocation = caps.ChromeBinary;
			return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
