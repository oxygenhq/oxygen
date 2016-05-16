using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.Models
{
	[Serializable()]
	[XmlRoot("suite-config", Namespace = "", IsNullable = false)]
	public class TestSuiteConfiguration
	{
		[XmlElement("page-objects")]
		public PageObjects PageObjects { get; set; }
		[XmlElement("test-cases")]
		public TestCases TestCases { get; set; }
	}
	[Serializable()]
	public class TestCases
	{
		[XmlElement("test-case")]
		public TestCaseRef[] References;
	}
	public class TestCaseRef
	{
		[XmlAttribute("ref")]
		public string Ref;
	}
}
