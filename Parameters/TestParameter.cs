using System;
using System.Collections.Generic;

namespace CloudBeat.Oxygen.Parameters
{
	public class TestParameter
	{
		string name;
		string currentValue;
		int currentValIndex = -1; // default: -1 means that this is single value parameter
		string testCaseName;
		ParameterSourceSettings settings;
		IList<string> values;
		bool isSingleValueParameter;
		
		public TestParameter(string name, IList<string> values, ParameterSourceSettings settings)
		{
			this.values = values;
			this.name = name;
			this.currentValue = null;
			this.testCaseName = settings.TestCaseName;
			this.settings = settings;
			isSingleValueParameter = false;
		}
		public TestParameter(string name, string value, string testCaseName)
		{
			this.name = name;
			this.currentValue = value;
			this.testCaseName = testCaseName;
			isSingleValueParameter = true;
		}
		public string Name { get { return name; } }
		public string GetValue()
		{
			return currentValue;
		}

		public bool ReadNextValue()
		{
			if (isSingleValueParameter)
				return true;
			if (values == null || values.Count == 0)
				return false;
			if (settings.NextValue == ParameterSourceSettings.NextValueMode.Sequential)
			{
				currentValIndex++;
				if (currentValIndex > values.Count - 1)	// end of file
				{
					if (settings.OutOfValue == ParameterSourceSettings.OutOfValuesMode.LastValue)
						return true;	// keep the current value
					else if (settings.OutOfValue == ParameterSourceSettings.OutOfValuesMode.Stop)
						return false;
					currentValIndex = 0;
				}
			}
			else
				currentValIndex = (new Random()).Next(0, values.Count - 1);
			currentValue = values[currentValIndex];

			return true;
		}
	}
}
