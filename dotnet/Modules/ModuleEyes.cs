using Applitools;
using CloudBeat.Oxygen.Models;
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
            var result = new CommandResult(new Command("init", apiKey, appName, testName).ToJSCommand(Name));

            web = modules["web"] as ModuleWeb;
            if (web == null || !web.IsInitialized)
                return result.ErrorBase(CheckResultStatus.APPLITOOLS, "web module hasn't been initialized.");

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
            var result = new CommandResult(new Command("close").ToJSCommand(Name));

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
				TestResults tr = eyes.Close(false);
                return result.SuccessBase(tr);
			}
			catch (Exception e)
			{
                return result.ErrorBase(CheckResultStatus.APPLITOOLS, e.Message);
			}
		}

        public CommandResult forceFullPageScreenshot(bool force)
        {
            var result = new CommandResult(new Command("forceFullPageScreenshot", force).ToJSCommand(Name));

            if (eyes == null)
                return eyesNotInitedResult(result);

            eyes.ForceFullPageScreenshot = force;
            return result.SuccessBase();
        }

        public CommandResult checkWindow()
		{
            var result = new CommandResult(new Command("checkWindow").ToJSCommand(Name));

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
                eyes.CheckWindow(web.prevTransaction);
                return result.SuccessBase();
			}
			catch (Exception e)
			{
                return result.ErrorBase(CheckResultStatus.APPLITOOLS, e.Message);
			}
		}

        public CommandResult checkRegion(string target)
		{
            var result = new CommandResult(new Command("checkRegion", target).ToJSCommand(Name));

            if (eyes == null)
                return eyesNotInitedResult(result);

			try
			{
                var locator = web.driver.ResolveLocator(target);
                if (locator == null)
                    return result.ErrorBase(CheckResultStatus.APPLITOOLS, "Target not found");

				eyes.CheckRegion(locator, web.prevTransaction);
                return result.SuccessBase();
			}
			catch (Exception e)
			{
                return result.ErrorBase(CheckResultStatus.APPLITOOLS, e.Message);
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
            return result.ErrorBase(CheckResultStatus.APPLITOOLS, "Eyes module hasn't been initalized. 'eyes.init' should be called before interacting with other methods.");
        }
	}
}
