using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Selenium.Parameters
{
	public class ParameterSourceSettings
	{
		public enum FormatType
		{
			CSV,
			Excel
		}
		public enum NextValueMode
		{
			Sequential,
			Random
		}
		public enum OutOfValuesMode
		{
			StartOver,
			LastValue,
			Stop
		}
		public string Content { get; set; }
		public string FilePath { get; set; }
		public string TestCaseName { get; set; }
		public FormatType Format {  get; set; }
		public NextValueMode NextValue { get; set; }
		public OutOfValuesMode OutOfValue { get; set; }
	}
}
