/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 

namespace CloudBeat.Oxygen
{
    public class CommandResult
    {
        public string ModuleName { get; set; }
        public string CommandName { get; set; }
        public string CommandExpression { get; set; }
        public bool IsSuccess { get; set; }
        public bool IsAction { get; set; }
        public string TransactionName { get; set; }
        public string Screenshot { get; set; }
        public string Har { get; set; }
        public int DomContentLoadedEvent { get; set; }
        public int LoadEvent { get; set; }
        public object ReturnValue { get; set; }
        public string ErrorType { get; set; }       // CheckResultStatus
        public string ErrorMessage { get; set; }    // Error details. On ErrorType == UNKNOWN_ERROR populated with exception type + message.
        public string ErrorStackTrace { get; set; } // Exception stacktrace. Populated only on ErrorType == UNKNOWN_ERROR.


        public CommandResult(string moduleName, string commandName, params object[] args)
        {
            this.ModuleName = moduleName;
            this.CommandName = commandName;

            // build command name
            var argsQuoted = new string[args.Length];
            for (int i = 0; i < args.Length; i++)
            {
                var arg = args[i];
                var argEscaped = arg.ToString().Replace("'", @"\'").Replace(@"\\'", @"\'");
                argsQuoted[i] = arg.GetType() == typeof(string) ? "'" + argEscaped + "'" : argEscaped;
            }
            this.CommandExpression = string.Format("{0}.{1}({2});", moduleName.ToLower(), commandName, argsQuoted.Length > 0 ? string.Join(", ", argsQuoted) : "");
        }

        public CommandResult ErrorBase(CloudBeat.Oxygen.Modules.Module.ErrorType errType, string errMsg = null)
        {
            this.IsSuccess = false;
            this.ErrorType = errType.ToString();
            this.ErrorMessage = errMsg;
            return this;
        }

        public CommandResult SuccessBase(object retVal = null)
        {
            this.IsSuccess = true;
            this.ReturnValue = retVal;
            return this;
        }
    }
}
