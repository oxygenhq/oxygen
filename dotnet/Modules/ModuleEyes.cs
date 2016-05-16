using Applitools;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.JSEngine
{
	/*public class ModuleEyes
	{
		public delegate void ExceptionEventHandler(string commandName, Exception e);
		public event ExceptionEventHandler CommandException;

		public delegate void ExecutingEventHandler();
		public event ExecutingEventHandler CommandExecuting;

		public delegate void ExecutedEventHandler(SeCommand cmd, int domContentLoaded, int load);
		public event ExecutedEventHandler CommandExecuted;

		private string apiKey;
		private IWebDriverModule mainModule;
		private Eyes eyes;
		private IWebDriver eyesDriver;
		public ModuleEyes(IWebDriverModule mainModule, string apiKey = null)
		{
			this.apiKey = apiKey;
			this.mainModule = mainModule;
			eyes = new Eyes();
		}
		public void Enable(string apiKey = null)
		{
			if (string.IsNullOrEmpty(apiKey) && string.IsNullOrEmpty(this.apiKey))
				throw new ArgumentException("Applitools API key is not specified");
			if (!string.IsNullOrEmpty(apiKey))
				this.apiKey = apiKey;
			// eyes.enable must be called before any call to web or mobile modules!
			// check that Selenium driver in the main module has not been initialized
			if (mainModule == null)
				throw new ArgumentNullException("mainModule");
			if (mainModule.GetDriver() == null)
				mainModule.Init();

			eyes.ApiKey = this.apiKey;
			eyesDriver = eyes.Open(mainModule.GetDriver(), "Applitools", "Test Web Page",
								   new System.Drawing.Size(1024, 768));
		}
		public TestResults close(bool throwEx = false)
		{
			if (eyes != null)
			{
				try
				{
					return eyes.Close(throwEx);
				}
				catch (Exception e)
				{
					if (CommandException != null)
					{
						CommandException("close", e);
						return null;
					}
					else
						throw;
				}
				finally
				{
					eyes.AbortIfNotClosed();
				}
			}
			return null;
				
		}
		public void checkWindow(string tag = null)
		{
			try
			{
				if (eyes == null)
					throw new Exception("Eyes module is not enabled. Call enable() first!");
				eyes.CheckWindow(tag);
			}
			catch (Exception e)
			{
				if (CommandException != null)
					CommandException("checkWindow", e);
				else
					throw;
			}
		}
		public void checkRegion(string target, string tag = null)
		{
			try
			{
				var locator = mainModule.GetDriver().ResolveLocator(target);
				if (locator == null)
					throw new ArgumentException("Target not found: " + target, "target");
				eyes.CheckRegion(locator, tag);
			}
			catch (Exception e)
			{
				if (CommandException != null)
					CommandException("checkWindow", e);
				else
					throw;
			}
		}
	}*/
}
