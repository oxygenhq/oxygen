/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using Applitools;
using System;
using System.Collections.Generic;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleEyes : Module, IModule
	{
        private ModuleWeb web;
		private Eyes eyes;
        private Dictionary<string, IModule> modules;

        public ModuleEyes(Dictionary<string, IModule> modules)
		{
            this.modules = modules;
		}

        public CommandResult init(string apiKey, string appName, string testName)
		{
            var result = new CommandResult(Name, "init", apiKey, appName, testName);

            web = modules["web"] as ModuleWeb;
            if (web == null || !web.IsInitialized)
                return result.ErrorBase(ErrorType.APPLITOOLS, "web module hasn't been initialized.");

            eyes = new Eyes();
			eyes.ApiKey = apiKey;
            // we discard eyes' driver wrapper since there is no easy way to make it work with our custom driver implementation
            // it seems to be needed solely for replaying mouse/keyboard interactions according to -
            // http://support.applitools.com/customer/portal/questions/9866542-using-own-implementation-of-webdriver
            eyes.Open(web.driver, appName, testName);

            IsInitialized = true;
            return result.SuccessBase();
		}

        public CommandResult close()
		{
            var result = new CommandResult(Name, "close");

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
				TestResults tr = eyes.Close(false);
                return result.SuccessBase(tr);
			}
			catch (Exception e)
			{
                return result.ErrorBase(ErrorType.APPLITOOLS, e.Message);
			}
		}

        public CommandResult forceFullPageScreenshot(bool force)
        {
            var result = new CommandResult(Name, "forceFullPageScreenshot", force);

            if (eyes == null)
                return eyesNotInitedResult(result);

            eyes.ForceFullPageScreenshot = force;
            return result.SuccessBase();
        }

        public CommandResult checkWindow()
		{
            var result = new CommandResult(Name, "checkWindow");

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
                eyes.CheckWindow(web.prevTransaction);
                return result.SuccessBase();
			}
			catch (Exception e)
			{
                return result.ErrorBase(ErrorType.APPLITOOLS, e.Message);
			}
		}

        public CommandResult checkRegion(string target)
		{
            var result = new CommandResult(Name, "checkRegion", target);

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
                var locator = web.driver.ResolveLocator(target);
                if (locator == null)
                    return result.ErrorBase(ErrorType.APPLITOOLS, "Target not found");

				eyes.CheckRegion(locator, web.prevTransaction);
                return result.SuccessBase();
			}
			catch (Exception e)
			{
                return result.ErrorBase(ErrorType.APPLITOOLS, e.Message);
			}
		}

        public bool Initialize(System.Collections.Generic.Dictionary<string, string> args, ExecutionContext ctx)
        {
            this.ctx = ctx;
            return true;
        }

        public bool Dispose()
        {
            return true;
        }

        public object IterationStarted()
        {
            return null;
        }

        public object IterationEnded()
        {
            if (IsInitialized)
                eyes.AbortIfNotClosed();
            return null;
        }

        private CommandResult eyesNotInitedResult(CommandResult result)
        {
            return result.ErrorBase(ErrorType.APPLITOOLS, "Eyes module hasn't been initalized. 'eyes.init' should be called before interacting with other methods.");
        }
	}
}
