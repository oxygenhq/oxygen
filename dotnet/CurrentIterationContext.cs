using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen
{
	public class CurrentIterationContext
	{
		public TestCase TestCase { get; set; }
		public int TestCaseSequence { get; set; }
		public int TestSuiteSequence { get; set; }
		[XmlArray("Parameters")]
		[XmlArrayItem("Parameter", typeof(KeyValuePair<string, string>))]
		public Dictionary<string, string> Parameters { get; set; }
		[XmlArray("Variables")]
		[XmlArrayItem("Variable", typeof(KeyValuePair<string, string>))]
		public Dictionary<string, string> Environment { get; set; }
		public List<KeyValuePair<string, string>> Variables { get; set; }
	}
}
