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
            modules.Add("eyes", new ModuleEyes(modules));
			ctx = new ExecutionContext();

			// uncomment for debugging
			//Thread.Sleep(25000);
		}
		public Task<object> Invoke(dynamic input)
		{
			string name = (string)input.module;
			string method = (string)input.method;

			if (string.IsNullOrEmpty(name) || !modules.ContainsKey(name))   // FIXME: should these two checks be dropped?
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
                var initArgs = ConvertExpandoObjectToDictionary(input.args as ExpandoObject);
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

                try
                {
                    if (args[i].GetType() == typeof(string))
                        args[i] = SubstituteVariable(args[i] as string);
                }
                catch (OxVariableUndefined u)
                {
                    var result = new CommandResult(new Command(method, args).ToJSCommand(name));
                    result.IsSuccess = false;
                    result.EndTime = DateTime.UtcNow;
                    result.StatusText = CheckResultStatus.VARIABLE_NOT_DEFINED.ToString();
                    result.StatusData = u.Message;
                    return Task.FromResult<object>(GetInvokeResult(module, method, null, result, null));
                }
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

        private string SubstituteVariable(string str)
        {
            if (str == null)
                return null;

            while (true)
            {
                var varIndexStart = str.IndexOf("${");
                if (varIndexStart == -1)
                    return str;

                var varIndexEnd = str.IndexOf('}', varIndexStart + 2);
                var variableName = str.Substring(varIndexStart + 2, varIndexEnd - varIndexStart - 2);
                string variableValue = null;
                // check if this is a constant variable, such as ENTER key, etc.
                if (SeleniumDriver.constantVariables != null && SeleniumDriver.constantVariables.ContainsKey(variableName.ToUpper()))
                    variableValue = SeleniumDriver.constantVariables[variableName.ToUpper()];
                else if (ctx.Variables != null && ctx.Variables.ContainsKey(variableName))
                    variableValue = ctx.Variables[variableName];
                else if (ctx.Parameters != null && ctx.Parameters.ContainsKey(variableName) && !String.IsNullOrEmpty(ctx.Parameters[variableName]))
                    variableValue = ctx.Parameters[variableName];
                else if (ctx.Environment != null && ctx.Environment.ContainsKey(variableName))
                    variableValue = ctx.Environment[variableName];

                if (variableValue != null)
                    str = str.Substring(0, varIndexStart) + variableValue + str.Substring(varIndexEnd + 1);
                else
                    throw new OxVariableUndefined(variableName);
            }
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
				ctx.Parameters = ConvertExpandoObjectToDictionary(inParams);
			else if (inParams != null && inParams.GetType() == typeof(object[]))
				ctx.Parameters = CreateArgsDictionary(inParams);
			// environments
			if (inEnv != null && inEnv.GetType() == typeof(ExpandoObject))
				ctx.Environment = ConvertExpandoObjectToDictionary(inEnv);
			else if (inEnv != null && inEnv.GetType() == typeof(object[]))
				ctx.Environment = CreateArgsDictionary(inEnv);
			// variables
			if (inVars != null && inVars.GetType() == typeof(ExpandoObject))
				ctx.Variables = ConvertExpandoObjectToDictionary(inVars);
			else if (inVars != null && inVars.GetType() == typeof(object[]))
				ctx.Variables = CreateArgsDictionary(inVars);
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
                string s = item.ToString();
                int ei = s.IndexOf('=');
                int ai = s.IndexOf('@') + 1;
                args.Add(s.Substring(ai, ei - ai), s.Substring(ei + 1));
			}
			return args;
		}
	}
}