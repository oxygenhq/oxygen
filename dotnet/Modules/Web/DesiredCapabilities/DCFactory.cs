/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen.Modules
{
    public static class DCFactory
    {
        public static DesiredCapabilities Get(string browser, string chromeBinary = null)
        {
            switch (browser.ToLower())
            {
                case "chrome":
                    return new DCChrome().Create(new Capabilities() { ChromeBinary = chromeBinary });
                case "firefox":
                    return new DCFirefox().Create(null);
				case "ie":
					return new DCInternetExplorer().Create(null);
                default:
                    return null;
            }
        }
    }
}
