using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Reflection;

namespace CloudBeat.Oxygen.Modules
{
    public abstract class Module
	{
        public enum ErrorType
        {
            // general
            VARIABLE_NOT_DEFINED,
            UNKNOWN_PAGE_OBJECT,
            UNKNOWN_ERROR,
            COMMAND_NOT_IMPLEMENTED,
            DUPLICATE_TRANSACTION,
            // web
            NO_ELEMENT,
            ASSERT,
            SCRIPT_TIMEOUT,
            UNHANDLED_ALERT,
            ELEMENT_NOT_VISIBLE,
            FRAME_NOT_FOUND,
            STALE_ELEMENT,
            INVALID_OPERATION,  // misc InvalidOperationExceptions such as "Element is not clickable at point (x, y). Other element would receive the click"
            XML_ERROR,
            NO_ALERT_PRESENT,
            BROWSER_JS_EXECUTE_ERROR,
            NAVIGATE_TIMEOUT,   // load event did not fire. this might also happen due to a bug in chromedriver.
            // soap
            SOAP,
            // db
            DB_CONNECTION,
            DB_QUERY,
            // eyes
            APPLITOOLS
        }

        public string Name { get { return this.GetType().Name.Substring("Module".Length); } }
        protected ExecutionContext ctx;
        public bool IsInitialized { get; protected set; }

        /// <summary>
        /// Method for executing module's commands. 
        /// Only public instance methods with return type of CommandResult will be allowed to execute.
        /// This method will NOT throw:
        ///     In case of properly handled exceptions, CommandResult.StatusText will contain relevant CheckResultStatus string.
        ///     Otherwise CommandResult.StatusText will contain CheckResultStatus.UNKNOWN_ERROR
        /// </summary>
        /// <param name="name">Command name</param>
        /// <param name="args">Arguments to invoke the command with.</param>
        /// <returns></returns>
        public virtual CommandResult ExecuteCommand(string name, params object[] args)
        {
            var result = new CommandResult(Name, name, args);

            Type[] paramTypes = null;
            try
            {
                paramTypes = ProcessArguments(args);
            }
            catch (OxVariableUndefined u)
            {
                return result.ErrorBase(ErrorType.VARIABLE_NOT_DEFINED, u.Message);
            }

            try
            {
                Type modType = this.GetType();
                MethodInfo method = modType.GetMethod(name, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance, null, paramTypes, null);
                if (method == null)
                    return result.ErrorBase(ErrorType.UNKNOWN_ERROR, ".NET: cannot find method. Possible name or arguments type mismatch.");
                if (method.ReturnType != typeof(CommandResult))
                    return result.ErrorBase(ErrorType.UNKNOWN_ERROR, ".NET: attempted to invoke method with return type other than CommandResult.");

                return method.Invoke(this, args) as CommandResult;
            }
            catch (Exception e)
            {
                // module commands should catch all exceptions and return proper CommandResult with error details
                // however as a safety measure we also catch everything that might haven't been caught
                e = e is TargetInvocationException ? e.InnerException : e;
                result.ErrorStackTrace = e.StackTrace;
                return result.ErrorBase(ErrorType.UNKNOWN_ERROR, e.GetType().Name + ": " + e.Message);
            }
        }

        public static Dictionary<string, string> ConvertExpandoObjectToDictionary(System.Dynamic.ExpandoObject obj)
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

        public Type[] ProcessArguments(params object[] args)
        {
            Type[] paramTypes = new Type[args.Length];
            for (int i = 0; i < args.Length; i++)
            {
                // convert ExpandoObject to Dictionary
                if (args[i].GetType() == typeof(ExpandoObject))
                    args[i] = ConvertExpandoObjectToDictionary(args[i] as ExpandoObject);
                paramTypes[i] = args[i].GetType();

                if (args[i].GetType() == typeof(string))
                    args[i] = SubstituteVariable(args[i] as string);
            }
            return paramTypes;
        }
	}

    public class OxException : Exception
    {
        public OxException()
        {
        }

        public OxException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public OxException(string message)
            : base(message)
        {
        }
    }

    public class OxModuleInitializationException : Exception
    {
        public OxModuleInitializationException(string reason)
            : base(reason)
        {
        }

        public OxModuleInitializationException(string reason, Exception e)
            : base(reason, e)
        {
        }
    }

    public class OxVariableUndefined : OxException
    {
        public OxVariableUndefined(string variableName)
            : base("Variable '" + variableName + "' is not defined.")
        {
        }
    }
}
