using System;
using System.Collections.Generic;
//using System.Linq;
//using System.Text;

namespace CloudBeat.Oxygen.Parameters
{
	public class ParameterManager : IParameterManager
	{
		Dictionary<string, TestParameter> paramHash;

		public ParameterManager()
		{
			paramHash = new Dictionary<string, TestParameter>();
		}
		public ParameterManager(IParameterReader reader)
		{
			AddParametersToHash(reader.ReadAll());
		}
		private void AddParametersToHash(IList<TestParameter> paramList)
		{
			if (paramList == null)
				return;
			paramHash = new Dictionary<string, TestParameter>();
			foreach (var param in paramList)
				paramHash.Add(param.Name, param);
		}
		/*
		 * Currently executed test case name or id
		 */ 
		public void AddParameter(TestParameter param)
		{
			paramHash.Add(param.Name, param);
		}
		public bool ContainsParameter(string name)
		{
			return paramHash.ContainsKey(name.ToUpper());
		}
		public string GetValue(string paramName)
		{
			if (!ContainsParameter(paramName))
				throw new ParameterNotFoundException(paramName);
			return paramHash[paramName.ToUpper()].GetValue();
		}
		public void ReadNextValues()
		{
			foreach (var param in paramHash.Values)
			{
				param.ReadNextValue();
			}
		}
		public Dictionary<string, string> GetCurrentParameterValues()
		{
			Dictionary<string, string> paramValues = new Dictionary<string, string>();
			foreach (var param in paramHash.Values)
			{
				paramValues.Add(param.Name, param.GetValue());
			}
			return paramValues;
		}
	}
}
