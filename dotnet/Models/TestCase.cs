using CloudBeat.Oxygen.Parameters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.Models
{
	public class TestCase
	{
		[XmlAttribute("name")]
		public string Name;
		[XmlAttribute("id")]
		public string Id;
		[XmlAttribute("scriptPath")]
		public string ScriptPath;
		[XmlAttribute("scriptContent")]
		public string ScriptContent;
		[XmlAttribute("scriptType")]
		public ScriptType ScriptType;
		[XmlAttribute("iterations")]
		public int Iterations;
		public TestCaseConfiguration TestCaseConfig;
		public ParameterSourceSettings ParameterSettings;
	}

	// values should match those in CloudBeat.Core.Models.MonitorModel.ScriptTypeEnum !!!
	public enum ScriptType
	{
		Selenese = 0,
		JavaScript = 1
	}
}
