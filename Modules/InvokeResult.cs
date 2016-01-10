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
		public object ReturnValue { get; set; }
		public StepResult StepResult { get; set; }
		public List<KeyValuePair<string, string>> Variables { get; set; }
	}
}
