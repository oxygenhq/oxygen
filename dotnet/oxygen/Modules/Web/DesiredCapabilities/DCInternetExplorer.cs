/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using OpenQA.Selenium.IE;
using OpenQA.Selenium.Remote;

namespace CloudBeat.Oxygen.Modules
{
	public class DCInternetExplorer : IDCBrowser
    {
        public DesiredCapabilities Create(Capabilities caps) 
        {
            InternetExplorerOptions options = new InternetExplorerOptions();
            options.EnablePersistentHover = false;
            options.UnexpectedAlertBehavior = InternetExplorerUnexpectedAlertBehavior.Ignore;
            options.EnsureCleanSession = true;
            return (DesiredCapabilities)options.ToCapabilities();
        }
    }
}
