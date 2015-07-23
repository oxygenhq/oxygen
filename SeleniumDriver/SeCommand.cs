using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
    public class SeCommand
    {
        public int Line { get; set; }
        public string CommandName { get; set; }
        public object[] Arguments { get; set; } // should be null if no arguments
        public string TransactionName { get; set; }
        public bool IsSupported { get; set; }

        public override string ToString()
        {
            if (Arguments == null)
                return string.Format("{0}()", CommandName);

            var argsQuoted = new string[Arguments.Length];
            for (int i = 0; i < Arguments.Length; i++)
            {
                var arg = Arguments[i];
                argsQuoted[i] = arg.GetType() == typeof(string) ? "\"" + arg.ToString().Replace("\"", "&quot;") + "\"" : arg.ToString().Replace("\"", "&quot;");
            }
            return string.Format("{0}({1})", CommandName, string.Join(", ", argsQuoted));
        }

        public string ToJSCommand()
        {
            if (CommandName.EndsWith("AndWait", System.StringComparison.InvariantCultureIgnoreCase))
                CommandName = CommandName.Substring(0, CommandName.Length - "AndWait".Length);

            if (Arguments == null)
                return string.Format("web.{0}();", CommandName);

            var argsQuoted = new string[Arguments.Length];
            for (int i = 0; i < Arguments.Length; i++)
            {
                var arg = Arguments[i];
                var argEscaped = arg.ToString().Replace("'", @"\'").Replace(@"\\'", @"\'");
                argsQuoted[i] = arg.GetType() == typeof(string) ? "'" + argEscaped + "'" : argEscaped;
            }
            return string.Format("web.{0}({1});", CommandName, string.Join(", ", argsQuoted));
        }

        private static HashSet<string> actions = new HashSet<string>() 
        {
            "clickandwait", "click", "openandwait", "open", "doubleclick"
        };

        public bool IsAction()
        {
            return actions.Contains(CommandName.ToLowerInvariant());
        }
    }
}