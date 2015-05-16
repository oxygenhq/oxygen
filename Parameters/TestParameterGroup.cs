using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Selenium.Parameters
{
	public class TestParameterGroup
	{
		public string GroupName { get; set; }
		public IList<TestParameter> Parameters { get; set; }
	}
}
