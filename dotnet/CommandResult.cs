using System;

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
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double Duration { get; set; }
        public object ReturnValue { get; set; }
        public string ErrorType { get; set; }       // CheckResultStatus
        public string ErrorMessage { get; set; }    // Error details. On ErrorType == UNKNOWN_ERROR populated with exception type + message.
        public string ErrorStackTrace { get; set; } // Exception stacktrace. Populated only on ErrorType == UNKNOWN_ERROR.


        public CommandResult(string moduleName, string commandName, params object[] args)
        {
            this.StartTime = DateTime.UtcNow;
            this.ModuleName = moduleName;
            this.CommandName = commandName;

            // build command name

            if (args == null)
                this.CommandExpression = string.Format("{0}.{1}();", moduleName.ToLower(), commandName);

            var argsQuoted = new string[args.Length];
            for (int i = 0; i < args.Length; i++)
            {
                var arg = args[i];
                var argEscaped = arg.ToString().Replace("'", @"\'").Replace(@"\\'", @"\'");
                argsQuoted[i] = arg.GetType() == typeof(string) ? "'" + argEscaped + "'" : argEscaped;
            }
            this.CommandExpression = string.Format("{0}.{1}({2});", moduleName.ToLower(), commandName, string.Join(", ", argsQuoted));
        }

        public CommandResult ErrorBase(CloudBeat.Oxygen.Modules.Module.ErrorType errType, string errMsg = null)
        {
            this.EndTime = DateTime.UtcNow;
            this.Duration = (this.EndTime - this.StartTime).TotalSeconds;
            this.IsSuccess = false;
            this.ErrorType = errType.ToString();
            this.ErrorMessage = errMsg;
            return this;
        }

        public CommandResult SuccessBase(object retVal = null)
        {
            this.EndTime = DateTime.UtcNow;
            this.Duration = (this.EndTime - this.StartTime).TotalSeconds;
            this.IsSuccess = true;
            this.ReturnValue = retVal;
            return this;
        }
    }
}
