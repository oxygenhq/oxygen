using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen
{
    interface IDCBrowser
    {
        DesiredCapabilities Create(Capabilities caps);
    }
}
