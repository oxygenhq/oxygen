using System;
using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
    public class SeCommand
    {
        public int Line { get; set; }
        public string CommandName { get; set; }
        public string Target { get; set; }
        public string Value { get; set; }
        public string TransactionName { get; set; }
        public bool IsSupported { get; set; }

        public override string ToString()
        {
            if (string.IsNullOrWhiteSpace(Value))
                return string.Format("{0}(\"{1}\")", CommandName, Target.Replace("\"", "&quot;"));
            else
                return string.Format("{0}(\"{1}\", \"{2}\")", CommandName, Target.Replace("\"", "&quot;"), Value.Replace("\"", "&quot;"));
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