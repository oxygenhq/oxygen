using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen.Modules
{
    interface IDCBrowser
    {
        DesiredCapabilities Create(Capabilities caps);
    }
}
