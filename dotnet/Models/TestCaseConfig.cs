using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.Models
{
	[Serializable()]
	[XmlRoot("test-case-config", Namespace = "", IsNullable = false)]
	public class TestCaseConfiguration
	{
		[XmlElement("page-objects")]
		public PageObjects PageObjects { get; set; }
	}
	[Serializable()]
	public class PageObjects
	{
		[XmlElement("page")]
		public Page[] Pages;
	}
	public class Page
	{
		[XmlAttribute("title")]
		public string Title;
		[XmlAttribute("url")]
		public string Url;
		[XmlAttribute("name")]
		public string Name;
		[XmlElement(ElementName="object")]
		public PageObject[] Objects;
	}
	public class PageObject
	{
		[XmlAttribute("name")]
		public string Name;
		[XmlAttribute("locator")]
		public string Locator;
	}
}
