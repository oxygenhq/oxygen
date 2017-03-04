using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
	public class InvokeResult
	{
		public string Module { get; set; }
		public string Method { get; set; }
		public object ReturnValue { get; set; }
		public string ErrorType { get; set; }
		public string ErrorMessage { get; set; }
		public string ErrorDetails { get; set; }
		public CommandResult CommandResult { get; set; }
		public List<KeyValuePair<string, string>> Variables { get; set; }
	}
}
