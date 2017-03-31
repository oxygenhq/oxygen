/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
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
