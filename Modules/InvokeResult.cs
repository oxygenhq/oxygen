using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Modules
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
