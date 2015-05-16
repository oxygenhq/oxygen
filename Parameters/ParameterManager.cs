using System;
using System.Collections.Generic;
//using System.Linq;
//using System.Text;

namespace Selenium.Parameters
{
	public class ParameterManager
	{
		Dictionary<string, TestParameter> globalParameters;
		Dictionary<string, Dictionary<string, TestParameter>> testCaseParameters;

		public ParameterManager()
		{
			globalParameters = new Dictionary<string,TestParameter>();
			testCaseParameters = new Dictionary<string,Dictionary<string,TestParameter>>();
		}
		/*
		 * Currently executed test case name or id
		 */ 
		public string TestCaseName { get; set; }
		public void AddParameters(IParameterReader reader)
		{
			if (reader == null)
				throw new ArgumentNullException("reader");
			var groups = reader.ReadAll();
			foreach (var group in groups)
			{
				Dictionary<string, TestParameter> parameters;
				if (group.GroupName != null && testCaseParameters.ContainsKey(group.GroupName))
					parameters = testCaseParameters[group.GroupName];
				else if (!string.IsNullOrEmpty(group.GroupName))
					testCaseParameters.Add(group.GroupName, parameters = new Dictionary<string, TestParameter>());
				else
					parameters = globalParameters;
				foreach (var param in group.Parameters)
					parameters.Add(param.Name, param);
			}
		}
		public string GetValue(string paramName, string caseName = null)
		{
			if (caseName == null)
				caseName = TestCaseName;
			TestParameter parameter;
			paramName = paramName.ToUpper();
			// see if there is a test case scoped parameter first
			if (caseName != null)
			{
				if (!testCaseParameters.ContainsKey(caseName))
					throw new ParameterNotFoundException(paramName, caseName);
				var paramHash = testCaseParameters[caseName];
				if (paramHash != null)
				{
					if (!paramHash.ContainsKey(paramName))
						throw new ParameterNotFoundException(paramName, caseName);
					parameter = paramHash[paramName];
					if (parameter != null)
						return parameter.GetValue();
				}
			}
			parameter = globalParameters[paramName];
			if (parameter != null)
				return parameter.GetValue();
			throw new ParameterNotFoundException(paramName, caseName);
		}
		public void NextIteration(string testCaseName)
		{
			if (string.IsNullOrEmpty(testCaseName))
				return;
			if (!testCaseParameters.ContainsKey(testCaseName))
				return;
			// iteration id allows to read next value once for all the parameters attached to the same ParameterStore
			// without unique iteration id, each call to ReadNextValue() will read next line multiple times for various parameters of the same ParameterStore 
			var iterationId = Guid.NewGuid().ToString();
			var parameterHash = testCaseParameters[testCaseName];
			if (parameterHash == null)
				return; //throw new KeyNotFoundException("Test case with the following name was not found: " + testCaseName);
			foreach (var param in parameterHash.Values)
			{
				param.ReadNextValue();
			}
		}
	}
}
