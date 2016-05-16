using OpenQA.Selenium.IE;
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
	public class DCInternetExplorer : IDCBrowser
    {
        public DesiredCapabilities Create(Capabilities caps) 
        {
            InternetExplorerOptions options = new InternetExplorerOptions();
            options.EnablePersistentHover = false;
            options.UnexpectedAlertBehavior = InternetExplorerUnexpectedAlertBehavior.Ignore;
            return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
