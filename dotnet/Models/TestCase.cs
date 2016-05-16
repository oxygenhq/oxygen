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
		Selenese = 0, // TODO: deprecated and should be removed
		JavaScript = 1
	}

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
        public FormatType Format { get; set; }
        public NextValueMode NextValue { get; set; }
        public OutOfValuesMode OutOfValue { get; set; }
        public int? Line { get; set; }
    }
}
