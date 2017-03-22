using CloudBeat.Oxygen.Modules;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen
{
	public class Dispatcher
	{
		Dictionary<string, IModule> modules;
		ExecutionContext ctx;
		
        public Dispatcher()
		{
			modules = new Dictionary<string, IModule>();
			modules.Add("web", new ModuleWeb());
			modules.Add("soap", new ModuleSoap());
			modules.Add("db", new ModuleDB());
            modules.Add("assert", new ModuleAssert());
            modules.Add("eyes", new ModuleEyes(modules));
			ctx = new ExecutionContext();

            // uncomment for debugging
            //System.Diagnostics.Debugger.Launch();
		}
		public Task<object> Invoke(dynamic input)
		{
			string name = (string)input.module;
			string method = (string)input.method;

			if (string.IsNullOrEmpty(name) || !modules.ContainsKey(name))   // FIXME: should these two checks be dropped?
				throw new ArgumentException("Module not found", name);
			if (string.IsNullOrEmpty(method))
				throw new ArgumentNullException("method");

			UpdateExecutionContext(input.ctx);

			IModule module = modules[name];

			// FIXME: error handling for the following internal methods. should probably return CommandResult.
			if (method == "moduleInit")
			{
                var initArgs = Module.ConvertExpandoObjectToDictionary(input.args as ExpandoObject);
                return Task.FromResult<object>(module.Initialize(initArgs, ctx));
			}
			else if (method == "moduleDispose")
				return Task.FromResult<object>(module.Dispose());
			else if (method == "iterationStart")
				return Task.FromResult<object>(module.IterationStarted());
			else if (method == "iterationEnd")
				return Task.FromResult<object>(module.IterationEnded());

            CommandResult cr = module.ExecuteCommand(method, input.args as object[]);
            return Task.FromResult<object>(cr);
		}

		private void UpdateExecutionContext(dynamic inputCtx)
		{
			var inVars = inputCtx.vars;
			var inEnv = inputCtx.env;
			var inParams = inputCtx.@params;
			if (ctx == null)
				ctx = new ExecutionContext();
			// parameters
			if (inParams != null && inParams.GetType() == typeof(ExpandoObject))
				ctx.Parameters = Module.ConvertExpandoObjectToDictionary(inParams);
			else if (inParams != null && inParams.GetType() == typeof(object[]))
				ctx.Parameters = CreateArgsDictionary(inParams);
			// environments
			if (inEnv != null && inEnv.GetType() == typeof(ExpandoObject))
                ctx.Environment = Module.ConvertExpandoObjectToDictionary(inEnv);
			else if (inEnv != null && inEnv.GetType() == typeof(object[]))
				ctx.Environment = CreateArgsDictionary(inEnv);
			// variables
			if (inVars != null && inVars.GetType() == typeof(ExpandoObject))
                ctx.Variables = Module.ConvertExpandoObjectToDictionary(inVars);
			else if (inVars != null && inVars.GetType() == typeof(object[]))
				ctx.Variables = CreateArgsDictionary(inVars);
		}

		private List<KeyValuePair<string, string>> ConvertDictionaryToKeyValueList(Dictionary<string, string> dic)
		{
			if (dic == null)
				return null;
			List<KeyValuePair<string, string>> list = new List<KeyValuePair<string,string>>();
			foreach (var key in dic.Keys)
				list.Add(new KeyValuePair<string, string>(key, dic[key]));
			return list;
		}

		private Dictionary<string, string> CreateArgsDictionary(object[] argsarr)
		{
			Dictionary<string, string> args = new Dictionary<string, string>();
			if (argsarr == null)
				return args;
			foreach (var item in argsarr)
			{
                string s = item.ToString();
                int ei = s.IndexOf('=');
                int ai = s.IndexOf('@') + 1;
                args.Add(s.Substring(ai, ei - ai), s.Substring(ei + 1));
			}
			return args;
		}
	}
}