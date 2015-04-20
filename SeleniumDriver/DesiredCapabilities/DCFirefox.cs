using OpenQA.Selenium.Remote;

namespace CloudBeat.Selenium
{
    public class DCFirefox : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
            return DesiredCapabilities.Firefox();
        }
    }
}
