using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Selenium.Parameters
{
	public class ParameterNotFoundException : Exception
	{
		string paramName, testCaseName;
		public ParameterNotFoundException(string paramName, string testCaseName)
		{
			this.paramName = paramName;
			this.testCaseName = testCaseName;
		}
		public string ParameterName { get { return paramName; } }
		public string TestCaseName { get { return testCaseName; } }
	}
}
