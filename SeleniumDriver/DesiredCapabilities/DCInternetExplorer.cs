using OpenQA.Selenium.IE;
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
	public class DCInternetExplorer : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
            InternetExplorerOptions options = new InternetExplorerOptions();
            options.EnablePersistentHover = false;
            return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
