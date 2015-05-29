
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
	public static class TestSuiteConfigLoader
	{
		public static TestSuiteConfiguration LoadFromFile(string path)
		{
			XmlSerializer serializer = new XmlSerializer(typeof(TestSuiteConfiguration));
			StreamReader reader = new StreamReader(path);
			var config = (TestSuiteConfiguration)serializer.Deserialize(reader);
			reader.Close();

			return config;
		}
		public static TestSuiteConfiguration Load(string xml)
		{
			XmlSerializer serializer = new XmlSerializer(typeof(TestSuiteConfiguration));
			var config = (TestSuiteConfiguration)serializer.Deserialize(new StringReader(xml));

			return config;
		}
	}
}
