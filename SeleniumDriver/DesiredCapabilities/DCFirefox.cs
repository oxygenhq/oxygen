using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
    public class DCFirefox : IDCBrowser
    {
        public DesiredCapabilities Create() 
        {
            return DesiredCapabilities.Firefox();
        }
    }
}
