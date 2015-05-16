using System;
using System.Collections.Generic;


namespace Selenium.Parameters
{
	public interface IParameterReader
	{
		IList<TestParameterGroup> ReadAll();
	}
}
