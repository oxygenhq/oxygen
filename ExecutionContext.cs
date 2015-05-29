using CloudBeat.Oxygen.Parameters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen
{
	public class ExecutionContext
	{
		public string TestCaseName { get; set; }
		public IParameterManager ParameterManager { get; set; }
		public IPageObjectManager PageObjectManager { get; set; }
		public int CurrentIterationLocal { get; set; }
		public int CurrentIterationGlobal { get; set; }
	}
}
