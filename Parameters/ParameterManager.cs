using System;
using System.Collections.Generic;
//using System.Linq;
//using System.Text;

namespace CloudBeat.Oxygen.Parameters
{
	public class ParameterManager : IParameterManager
	{
		Dictionary<string, TestParameter> parameters;

		public ParameterManager()
		{
			parameters = new Dictionary<string,TestParameter>();
		}
		/*
		 * Currently executed test case name or id
		 */ 
		public string TestCaseName { get; set; }
		public void AddParameter(TestParameter param)
		{
			parameters.Add(param.Name, param);
		}
		public void AddParameters(TestParameterGroup group)
		{
			foreach (var param in group.Parameters)
				AddParameter(param);
		}
		public bool ContainsParameter(string name)
		{
			return parameters.ContainsKey(name.ToUpper());
		}
		public string GetValue(string paramName)
		{
			if (!ContainsParameter(paramName))
				throw new ParameterNotFoundException(paramName);
			return parameters[paramName.ToUpper()].GetValue();
		}
		public void ReadNextValues()
		{
			foreach (var param in parameters.Values)
			{
				param.ReadNextValue();
			}
		}
	}
}
