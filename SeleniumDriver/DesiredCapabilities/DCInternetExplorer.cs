using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
	public class DCInternetExplorer : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
            return DesiredCapabilities.InternetExplorer();
        }
    }
}
