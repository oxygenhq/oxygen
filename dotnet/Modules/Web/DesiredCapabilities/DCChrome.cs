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
			ChromeOptions options = new ChromeOptions();
            if (caps != null && caps.ChromeBinary != null)
                options.BinaryLocation = caps.ChromeBinary;
			return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
