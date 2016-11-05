using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Modules
{
	public class Dispatcher
	{
		Dictionary<string, IModule> modules;
		ExecutionContext ctx;
		public Dispatcher()
		{
			// add standard modules
			modules = new Dictionary<string, IModule>();
			modules.Add("web", new ModuleWeb());
			modules.Add("soap", new ModuleSoap());
			modules.Add("db", new ModuleDB());
            modules.Add("assert", new ModuleAssert());
			ctx = new ExecutionContext();

			//Thread.Sleep(25000);
		}
		public Task<object> Invoke(dynamic input)
		{
			string name = (string)input.module;
			string method = (string)input.method;

			if (string.IsNullOrEmpty(name) || !modules.ContainsKey(name))
				throw new ArgumentException("Module not found", name);
			if (string.IsNullOrEmpty(method))
				throw new ArgumentNullException("method");
			// uppercase method's first letter
			method = Char.ToUpperInvariant(method[0]) + method.Substring(1);

			UpdateExecutionContext(input.ctx);

			IModule module = modules[name];

			// specially handle ModuleInitialize and ModuleDispose method calls
			if (method == "ModuleInit")
			{
                var initArgs = CreateArgsDictionary(input.args);
				return Task.FromResult<object>(module.Initialize(initArgs, ctx));
			}
			else if (method == "ModuleDispose")
				return Task.FromResult<object>(module.Dispose());
			else if (method == "IterationStart")
				return Task.FromResult<object>(module.IterationStarted());
			else if (method == "IterationEnd")
				return Task.FromResult<object>(module.IterationEnded());

			object[] args = input.args as object[];

			Type modType = module.GetType();

			Type[] paramTypes = new Type[args.Length];
			for (int i = 0; i < args.Length; i++)
			{
				// convert ExpandoObject to Dictionary
				if (args[i].GetType() == typeof(ExpandoObject))
                    args[i] = ConvertExpandoObjectToDictionary(args[i] as ExpandoObject);
				paramTypes[i] = args[i].GetType();
			}

			MethodInfo cmdMethod = modType.GetMethod(method, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance, null, paramTypes, null);
			object retval = null;
			try
			{
				retval = cmdMethod.Invoke(module, args);
			}
			catch (TargetInvocationException e)
			{
				return Task.FromResult<object>(GetInvokeResult(module, method, retval, null, e.InnerException));
			}
			if (retval != null && retval.GetType() == typeof(CommandResult))
			{
				var cr = retval as CommandResult;
				return Task.FromResult<object>(GetInvokeResult(module, method, cr.ReturnValue, cr, null));
			}
				
			return Task.FromResult<object>(GetInvokeResult(module, method, retval, null, null));
		}
		private void UpdateExecutionContext(dynamic inputCtx)
		{
			var inVars = inputCtx.vars;
			var inEnv = inputCtx.env;
			var inParams = inputCtx.@params;
			if (ctx == null)
				ctx = new ExecutionContext();
			ctx.Parameters = inParams != null ? CreateArgsDictionary(inParams) : ctx.Parameters;
			ctx.Environment = inEnv != null ? CreateArgsDictionary(inEnv) : ctx.Environment;
			ctx.Variables = inVars != null ? CreateArgsDictionary(inVars) : ctx.Variables;

		}
		private InvokeResult GetInvokeResult(IModule module, string method, object retval, CommandResult cmdResult, Exception e)
		{
			return new InvokeResult()
			{
				Module = module.Name,
				Method = method,
				ReturnValue = retval,
				ErrorType = e != null ? e.GetType().Name : null,
				ErrorMessage = e != null ? e.Message : null,
				ErrorDetails = e != null ? e.StackTrace : null,
				Variables = ConvertDictionaryToKeyValueList(ctx.Variables),
				CommandResult = cmdResult
			};
			
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

        private Dictionary<string, string> ConvertExpandoObjectToDictionary(System.Dynamic.ExpandoObject obj)
        {
            Dictionary<string, string> args = new Dictionary<string, string>();
            if (obj == null)
                return args;
            foreach (var item in obj)
            {
                if (item.Value != null && (item.Value.GetType() == typeof(string) || item.Value.GetType().IsPrimitive))
					args.Add(item.Key, item.Value.ToString());
				else if (item.Value != null && item.Value.GetType() == typeof(System.Dynamic.ExpandoObject))
				{
					var subdic = ConvertExpandoObjectToDictionary(item.Value as System.Dynamic.ExpandoObject);
					foreach (var subkey in subdic.Keys)
                        args.Add(item.Key + "." + subkey, subdic[subkey]);
                }
            }
            return args;
        }

		private Dictionary<string, string> CreateArgsDictionary(object[] argsarr)
		{
			Dictionary<string, string> args = new Dictionary<string, string>();
			if (argsarr == null)
				return args;
			foreach (var item in argsarr)
			{
                int i = item.ToString().IndexOf('=');
                args.Add(item.ToString().Substring(2, i - 2), item.ToString().Substring(i + 1));
			}
			return args;
		}
	}
}