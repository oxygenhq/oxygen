using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using System.Text;
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
			ctx = new ExecutionContext();

			Thread.Sleep(10000);
		}
		public Task<object> Invoke(dynamic input)
		{
			string name = (string)input.module;
			string method = (string)input.method;

			if (string.IsNullOrEmpty(name) && method == "TestInit")
			{
				ctx.Environment = ConvertExpandoObjectToDictionary(input.env);
				return Task.FromResult<object>(null);
			}
			else if (string.IsNullOrEmpty(name) && method == "IterationStart")
			{
				ctx.Parameters = ConvertExpandoObjectToDictionary(input.parameters);
				// call each module's IterationStarted method
				foreach (var m in modules.Values) m.IterationStarted();
				return Task.FromResult<object>(null);
			}
			if (!modules.ContainsKey(name))
				throw new ArgumentException("module not found", name);
			if (string.IsNullOrEmpty(method))
				throw new ArgumentNullException("method");
			// uppercase method's first letter
			method = Char.ToUpperInvariant(method[0]) + method.Substring(1);

			UpdateExecutionContext(input.ctx);

			IModule module = modules[name];

			// specially handle ModuleInitialize and ModuleDispose method calls
			if (method == "ModuleInit")
			{
				var initArgs = ConvertExpandoObjectToDictionary(input.args);
				return Task.FromResult<object>(module.Initialize(initArgs, ctx));
			}
			else if (method == "ModuleDispose")
				return Task.FromResult<object>(module.Dispose());

			object[] args = input.args as object[];
			if (((IDictionary<String, object>)input).ContainsKey("vars"))
				ctx.Variables = ConvertExpandoObjectToDictionary(input.vars);

			Type modType = module.GetType();

			Type[] paramTypes = new Type[args.Length];
			for (int i = 0; i < args.Length; i++)
				paramTypes[i] = args[i].GetType();

			MethodInfo cmdMethod = modType.GetMethod(method, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance, null, paramTypes, null);
			var retval = cmdMethod.Invoke(module, args);
			if (retval != null && retval.GetType() == typeof(StepResult))
			{
				var sr = retval as StepResult;
				return Task.FromResult<object>(GetInvokeResult(module, method, sr.ReturnValue, sr));
			}
				
			return Task.FromResult<object>(GetInvokeResult(module, method, retval, null));
		}
		private void UpdateExecutionContext(dynamic inputCtx)
		{
			var inVars = inputCtx.vars;
			var inEnv = inputCtx.env;
			var inParams = inputCtx.@params;
			if (ctx == null)
				ctx = new ExecutionContext();
			ctx.Parameters = inParams != null ? ConvertExpandoObjectToDictionary(inParams) : ctx.Parameters;
			ctx.Environment = inEnv != null ? ConvertExpandoObjectToDictionary(inEnv) : ctx.Environment;
			ctx.Variables = inVars != null ? ConvertExpandoObjectToDictionary(inVars) : ctx.Variables;

		}
		private InvokeResult GetInvokeResult(IModule module, string method, object retval, StepResult stepResult)
		{
			return new InvokeResult()
			{
				ReturnValue = retval,
				Variables = ConvertDictionaryToKeyValueList(ctx.Variables),
				StepResult = stepResult
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
				if (item.Value != null && item.Value.GetType() == typeof(string))
					args.Add(item.Key, item.Value.ToString());
			return args;
		}
	}
}