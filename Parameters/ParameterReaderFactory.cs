using Selenium.Parameters.Readers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Selenium.Parameters
{
	public static class ParameterReaderFactory
	{
		public static IParameterReader Create(ParameterSourceSettings settings)
		{
			if (settings.Format == ParameterSourceSettings.FormatType.CSV)
			{
				IParameterReader reader = new CsvParameterReader(settings);
				return reader;
			}
			throw new NotSupportedException("Not supported format: " + settings.Format.ToString());
		}
	}
}
