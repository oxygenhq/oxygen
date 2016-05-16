using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen
{
	public class ExecutionContext
	{
		public Dictionary<string, string> Parameters { get; set; }
		public Dictionary<string, string> Variables { get; set; }
		public Dictionary<string, string> Environment { get; set; }
		public IPageObjectManager PageObjectManager { get; set; }
	}
}
