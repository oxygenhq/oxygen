using OpenQA.Selenium.Remote;
using System;
using System.Reflection;
using System.Threading.Tasks;

namespace CloudBeat.Selenium.JSEngine
{
    public class Engine
	{
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

            DesiredCapabilities dc = DCFactory.Get("chrome");
            var cmdProc = new SeleniumDriver(new Uri("http://localhost:4444/wd/hub"), dc, null);
            modWeb.SetCmdProcessor(cmdProc);
        }

        public Task<object> Invoke(dynamic input)
        {
            string cmd = (string)input.cmd;
            object[] p = (object[])input.prm;
            object module;
            switch ((string)input.module) 
            {
                case "web": module = modWeb; break;
                case "db": module = modDB; break;
                case "soap": module = modSoap; break;
                case "assert": module = modAssert; break;
                default:
                    throw new ArgumentException("Invalid module name.");
            }

            Type modType = module.GetType();

            Type[] paramTypes = new Type[p.Length];
            for (int i = 0; i < p.Length; i++) 
                paramTypes[i] = p[i].GetType();

            MethodInfo cmdMethod = modType.GetMethod(cmd, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance, null, paramTypes, null);
            var result = cmdMethod.Invoke(module, p);
            return Task.FromResult(result);
        }
	}
}
