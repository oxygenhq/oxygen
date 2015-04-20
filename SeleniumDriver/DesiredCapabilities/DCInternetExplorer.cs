using OpenQA.Selenium.Remote;

namespace CloudBeat.Selenium
{
	public class DCInternetExplorer : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
            return DesiredCapabilities.InternetExplorer();
        }
    }
}
