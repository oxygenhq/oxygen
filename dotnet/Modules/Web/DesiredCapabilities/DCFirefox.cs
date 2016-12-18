using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen.Modules
{
    public class DCFirefox : IDCBrowser
    {
        public DesiredCapabilities Create(Capabilities caps) 
        {
            return DesiredCapabilities.Firefox();
        }
    }
}
