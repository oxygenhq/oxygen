using CloudBeat.Selenium.ConfigLoader;
using OpenQA.Selenium.Remote;
using Selenium.Parameters;
using System;
using System.Reflection;
using System.Threading.Tasks;

namespace CloudBeat.Selenium.JSEngine
{
    public class Engine
	{
        private SeleniumDriver selDriver;
        private ModuleWeb modWeb;
        private ModuleDB modDB;
        private ModuleSoap modSoap;
        private ModuleAssert modAssert;

        public Engine()
        {
            modWeb = new ModuleWeb(false, false);
            modDB = new ModuleDB();
            modSoap = new ModuleSoap();
            modAssert = new ModuleAssert();
        }

        private const string TESTCASE_NAME = "testcase1";

		private void Initialize(string browser, string seleniumUrl, string configFile, string paramFile, string paramNextVal)
		{
            DesiredCapabilities dc = DCFactory.Get(browser);
            selDriver = new SeleniumDriver(new Uri(seleniumUrl), dc, null);
            modWeb.SetCmdProcessor(selDriver);

            if (paramFile != null)
            {
                ParameterSourceSettings paramSettings = new ParameterSourceSettings();
                paramSettings.FilePath = paramFile;
                paramSettings.Format = ParameterSourceSettings.FormatType.CSV;
                paramSettings.TestCaseName = TESTCASE_NAME;
                if (paramNextVal == "random")
                    paramSettings.NextValue = ParameterSourceSettings.NextValueMode.Random;
                else
                    paramSettings.NextValue = ParameterSourceSettings.NextValueMode.Sequential;

                selDriver.AddParameters(paramSettings);
                selDriver.ParameterManager.TestCaseName = TESTCASE_NAME;
            }

            if (configFile != null)
            {
                var testCaseConfig = TestCaseConfigLoader.LoadFromFile(configFile);
                if (testCaseConfig.PageObjects != null)
                    selDriver.AddPageObjects(testCaseConfig.PageObjects);
            }
		}

        public Task<object> Invoke(dynamic input)
        {
            string mod = (string)input.module;
            string cmd = (string)input.cmd;
            object[] args = (object[])input.args;

            if (mod == "utils")
            {
                if (cmd == "close")
                {
                    selDriver.Close();
                    return Task.FromResult<object>(null);
                }
                else if (cmd == "initialize")
                {
                    Initialize((string)args[0], (string)args[1], args[3] as string, args[2] as string, args[4] as string);
                    return Task.FromResult<object>(null);
                }
                else if (cmd == "next_iteration") 
                {
                    selDriver.ParameterManager.NextIteration(TESTCASE_NAME);
                    return Task.FromResult<object>(null);
                }
            }

            object module;
            switch (mod) 
            {
                case "web": module = modWeb; break;
                case "db": module = modDB; break;
                case "soap": module = modSoap; break;
                case "assert": module = modAssert; break;
                default:
                    throw new ArgumentException("Invalid module name.");
            }

            Type modType = module.GetType();

            Type[] paramTypes = new Type[args.Length];
            for (int i = 0; i < args.Length; i++)
                paramTypes[i] = args[i].GetType();

            MethodInfo cmdMethod = modType.GetMethod(cmd, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance, null, paramTypes, null);
            var result = cmdMethod.Invoke(module, args);
            return Task.FromResult(result);
        }
	}
}
