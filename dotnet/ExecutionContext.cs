using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
	public class ExecutionContext
	{
		public Dictionary<string, string> Parameters { get; set; }
		public Dictionary<string, string> Variables { get; set; }
		public Dictionary<string, string> Environment { get; set; }
	}
}
