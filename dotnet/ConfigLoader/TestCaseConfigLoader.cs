
using CloudBeat.Oxygen.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.ConfigLoader
{
	public static class TestCaseConfigLoader
	{
		public static TestCaseConfiguration LoadFromFile(string path)
		{
			XmlSerializer serializer = new XmlSerializer(typeof(TestCaseConfiguration));
			StreamReader reader = new StreamReader(path);
			var config = (TestCaseConfiguration)serializer.Deserialize(reader);
			reader.Close();

			return config;
		}
		public static TestCaseConfiguration Load(string xml)
		{
			XmlSerializer serializer = new XmlSerializer(typeof(TestCaseConfiguration));
			var config = (TestCaseConfiguration)serializer.Deserialize(new StringReader(xml));

			return config;
		}
	}
}
