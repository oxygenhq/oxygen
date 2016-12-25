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
            result.StartTime = DateTime.UtcNow;

            web = modules["web"] as ModuleWeb;
            if (web == null || !web.IsInitialized)
            {
                result.IsSuccess = false;
                result.ErrorMessage = "web module hasn't been initialized.";
                result.EndTime = DateTime.UtcNow;
                return result;
            }

            eyes = new Eyes();
			eyes.ApiKey = apiKey;
            // we discard eyes' driver wrapper since there is no easy way to make it work with our custom driver implementation
            // it seems to be needed solely for replaying mouse/keyboard interactions according to -
            // http://support.applitools.com/customer/portal/questions/9866542-using-own-implementation-of-webdriver
            eyes.Open(web.driver, appName, testName);

            result.IsSuccess = true;
            result.EndTime = DateTime.UtcNow;
            return result;
		}

        public CommandResult close()
		{
            var result = new CommandResult(new Command("close").ToJSCommand(Name));
            result.StartTime = DateTime.UtcNow;

            if (eyes == null)
            {
                result.IsSuccess = false;
                result.ErrorMessage = "Eyes module hasn't been initalized. 'eyes.init' should be called before interacting with other methods.";
                result.EndTime = DateTime.UtcNow;
                return result;
            }

			try
			{
				TestResults tr = eyes.Close(false);
                result.ReturnValue = tr;
                result.IsSuccess = true;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
			catch (Exception e)
			{
                result.IsSuccess = false;
                result.ErrorMessage = e.Message;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
			finally
			{
                eyes.AbortIfNotClosed();
			}
		}

        public CommandResult checkWindow()
		{
            var result = new CommandResult(new Command("checkWindow").ToJSCommand(Name));
            result.StartTime = DateTime.UtcNow;

            if (eyes == null)
            {
                result.IsSuccess = false;
                result.ErrorMessage = "Eyes module hasn't been initalized. 'eyes.init' should be called before interacting with other methods.";
                result.EndTime = DateTime.UtcNow;
                return result;
            }

			try
			{
                eyes.CheckWindow(web.prevTransaction);
                result.IsSuccess = true;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
			catch (Exception e)
			{
                result.IsSuccess = false;
                result.ErrorMessage = e.Message;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
		}

        public CommandResult checkRegion(string target)
		{
            var result = new CommandResult(new Command("checkRegion", target).ToJSCommand(Name));
            result.StartTime = DateTime.UtcNow;

            if (eyes == null)
            {
                result.IsSuccess = false;
                result.ErrorMessage = "Eyes module hasn't been initalized. 'eyes.init' should be called before interacting with other methods.";
                result.EndTime = DateTime.UtcNow;
                return result;
            }

			try
			{
                var locator = web.driver.ResolveLocator(target);
                if (locator == null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Target not found";
                    result.EndTime = DateTime.UtcNow;
                    return result;
                }
				eyes.CheckRegion(locator, web.prevTransaction);
                result.IsSuccess = true;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
			catch (Exception e)
			{
                result.IsSuccess = false;
                result.ErrorMessage = e.Message;
                result.EndTime = DateTime.UtcNow;
                return result;
			}
		}

        public bool Initialize(System.Collections.Generic.Dictionary<string, string> args, ExecutionContext ctx)
        {
            this.ctx = ctx;
            IsInitialized = true;
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
            return null;
        }
	}
}
