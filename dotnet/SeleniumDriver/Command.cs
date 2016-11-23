using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
    public class Command
    {
        public int Line { get; set; }
        public string CommandName { get; set; }
        public object[] Arguments { get; set; } // should be null if no arguments
        public string TransactionName { get; set; }
        public bool IsSupported { get; set; }

        public Command()
        {
        }

        public Command(string name, params object[] args)
        {
            CommandName = name;
            Arguments = args;
        }

        public string ToJSCommand(string moduleName)
        {
            if (Arguments == null)
				return string.Format("{0}.{1}();", moduleName.ToLower(), CommandName);

            var argsQuoted = new string[Arguments.Length];
            for (int i = 0; i < Arguments.Length; i++)
            {
                var arg = Arguments[i];
                var argEscaped = arg.ToString().Replace("'", @"\'").Replace(@"\\'", @"\'");
                argsQuoted[i] = arg.GetType() == typeof(string) ? "'" + argEscaped + "'" : argEscaped;
            }
            return string.Format("{0}.{1}({2});", moduleName.ToLower(), CommandName, string.Join(", ", argsQuoted));
        }

        private static HashSet<string> actions = new HashSet<string>() 
        {
            "click", "open", "doubleclick"
        };

        public bool IsAction()
        {
            return actions.Contains(CommandName.ToLowerInvariant());
        }
    }
}