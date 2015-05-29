using System;
using System.Collections.Generic;


namespace CloudBeat.Oxygen.Parameters
{
	public interface IParameterReader
	{
		IList<TestParameterGroup> ReadAll();
	}
}
