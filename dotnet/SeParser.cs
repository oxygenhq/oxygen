using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.VisualBasic.FileIO;
using CloudBeat.Oxygen.Models;

namespace CloudBeat.Oxygen
{
    public class SeParser
    {
        public static IList<ParameterizationCSVModel> ParseParameterizationCSV(string csv, int minRows = 0)
        {
            IList<ParameterizationCSVModel> paramList = new List<ParameterizationCSVModel>();

            using (StringReader strReader = new StringReader(csv))
            {
                TextFieldParser parser = new TextFieldParser(strReader);
                parser.TextFieldType = FieldType.Delimited;
                parser.SetDelimiters(",");

                if (parser.EndOfData)
                    throw new OxParameterizationCSVException("Invalid CSV file. The file appears to be empty.");

                // process header
                string[] fields = parser.ReadFields();
                int paramCount = fields.Count();
                foreach (var name in fields)
                {
                    paramList.Add(new ParameterizationCSVModel { Name = name.Trim(' ', '\t').ToUpper(), Parameters = new List<string>() });
                }

                if (parser.EndOfData)
                    throw new OxParameterizationCSVException("Invalid CSV file. Found only the header.");

                // process params
                while (!parser.EndOfData)
                {
                    fields = parser.ReadFields();
                    if (fields.Length != paramCount)
                        throw new OxParameterizationCSVException("Invalid CSV file. Invalid parameters count.");

                    int listIndex = 0;
                    foreach (string param in fields)
                    {
                        paramList[listIndex++].Parameters.Add(param.Trim(' ', '\t'));
                    }
                }
                parser.Close();

                // padd with empty rows if needed
                var paramsCount = paramList[0].Parameters.Count;
                if (minRows > 0 && paramsCount < minRows)
                {

                    foreach (var param in paramList)
                    {
                        for (int i = 0; i < minRows - paramsCount; i++)
                            param.Parameters.Add("");
                    }
                }
            }

            return paramList;
        }
    }
}
