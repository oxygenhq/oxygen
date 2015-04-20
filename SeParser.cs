using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using System.Xml.Linq;
using System.Xml;
using Microsoft.VisualBasic.FileIO;
using System.Reflection;
using CloudBeat.Selenium.Models;

namespace CloudBeat.Selenium
{
    public class SeParser
    {
        private const string htmlNamespace = "http://www.w3.org/1999/xhtml";

        public static IList<SeCommand> ParseFromFile(string seFilePath, out string baseURL)
        {
            using (StreamReader reader = new StreamReader(seFilePath))
            {
                return Parse(reader, out baseURL);
            }
        }

        public static IList<SeCommand> ParseFromString(string seFileContent, out string baseURL)
        {
            using (StringReader reader = new StringReader(seFileContent))
            {
                return Parse(reader, out baseURL);
            }
        }


        private static string Format(IList<XNode> nodes)
        {
            StringBuilder sb = new StringBuilder();
            foreach (var n in nodes)
            {
                string val = n.ToString();

                if (val == "<br xmlns=\"http://www.w3.org/1999/xhtml\" />")
                    sb.Append(Environment.NewLine);
                else
                    sb.Append(HttpUtility.HtmlDecode(val.Trim()));
            }
            return sb.ToString();
        }

        public static IList<SeCommand> Parse(TextReader seFile, out string baseURL)
        {
            List<SeCommand> result = new List<SeCommand>();
            XDocument xDocument;
            try
            {
                xDocument = XDocument.Load(seFile);
            }
            catch (XmlException xe)
            {
                throw new SeParseException("Unable to parse the script: " + xe.Message);
            }

            XNamespace ns = XNamespace.Get(htmlNamespace);
            baseURL = xDocument.Descendants().First(e => e.Name.Equals(ns.GetName("link"))).Attribute("href").Value;
            var tBodyElement = xDocument.Descendants().First(e => e.Name.Equals(ns.GetName("tbody")));
            int scriptLine = 1;
            string currentTransactionName = null;

            foreach (var row in tBodyElement.Nodes())
            {
                if (row.NodeType == XmlNodeType.Comment)
                {
                    var comment = (row as XComment).Value;
                    if (comment.StartsWith("@"))
                    {
                        currentTransactionName = comment.Substring(1);
                    }
                }
                else
                {
                    var columnValues = ((XElement)row).Elements(ns.GetName("td")).Select(e => e.Nodes());

                    var cmdName = SeParser.Format(columnValues.First().ToList());

                    result.Add(new SeCommand
                    {
                        Line = scriptLine++,
                        CommandName = cmdName,
                        Target = SeParser.Format(columnValues.Skip(1).First().ToList()),
                        Value = SeParser.Format(columnValues.Skip(2).First().ToList()),
                        TransactionName = currentTransactionName
                    });
                }

                foreach (var r in result)
                {
                    if (r.TransactionName == null)
                        throw new SeParseException(r.CommandName + " command is not enclosed within a transaction.");
                }
            }
            return result;
        }

        /// <summary>
        /// Checks if all the supplied commands have an implementation in SeCommandProcessor.
        /// </summary>
        /// <param name="cmds">Commands to check.</param>
        /// <returns>IList containing all unimplemented commands or empty list otherwise.</returns>
        public static IList<SeCommand> Validate(string seleniumScript)
        {
            string baseUrl;
            IList<SeCommand> cmds = SeParser.ParseFromString(seleniumScript, out baseUrl);
    
            Type tCmdProc = typeof(SeleniumDriver);

            foreach (var cmd in cmds)
            {
                string commandName = cmd.CommandName;
                if (cmd.CommandName.EndsWith("AndWait", StringComparison.InvariantCultureIgnoreCase))
                    commandName = cmd.CommandName.Remove(cmd.CommandName.Length - "AndWait".Length);

                MethodInfo cmdMethod = tCmdProc.GetMethod(SeleniumDriver.SE_CMD_METHOD_PREFIX + commandName, BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
                cmd.IsSupported = cmdMethod != null;
            }

            return cmds;
        }

        public static IList<ParameterizationCSVModel> ParseParameterizationCSV(string csv)
        {
            IList<ParameterizationCSVModel> paramList = new List<ParameterizationCSVModel>();

            using (StringReader strReader = new StringReader(csv))
            {
                TextFieldParser parser = new TextFieldParser(strReader);
                parser.TextFieldType = FieldType.Delimited;
                parser.SetDelimiters(",");

                if (parser.EndOfData)
                    throw new SeParameterizationCSVException("Invalid CSV file. The file appears to be empty.");

                // process header
                string[] fields = parser.ReadFields();
                int paramCount = fields.Count();
                foreach (var name in fields)
                {
                    paramList.Add(new ParameterizationCSVModel { Name = name.Trim(' ', '\0').ToUpper(), Parameters = new List<string>() });
                }

                if (parser.EndOfData)
                    throw new SeParameterizationCSVException("Invalid CSV file. Found only the header.");

                // process params
                while (!parser.EndOfData)
                {
                    fields = parser.ReadFields();
                    if (fields.Length != paramCount)
                        throw new SeParameterizationCSVException("Invalid CSV file. Invalid parameters count.");

                    int listIndex = 0;
                    foreach (string param in fields)
                        paramList[listIndex++].Parameters.Add(param);
                }
                parser.Close();
            }

            return paramList;
        }

        public static IList<string> GetParameters(IList<SeCommand> cmds)
        {
            var paramList = new List<string>();

            foreach (var cmd in cmds)
            {
                var str = cmd.Target + cmd.Value;
                while (true)
                {
                    var varIndexStart = str.IndexOf("${", StringComparison.InvariantCultureIgnoreCase);
                    if (varIndexStart == -1)
                        break;

                    var varIndexEnd = str.IndexOf('}', varIndexStart + 2);
                    var variableName = str.Substring(varIndexStart + 2, varIndexEnd - varIndexStart - 2);
                    paramList.Add(variableName);
                    str = str.Substring(varIndexEnd + 1);
                }
            }

            return paramList;
        }
        public static IList<string> GetParameters(string script)
        {
            var paramList = new List<string>();
            while (true)
            {
                var varIndexStart = script.IndexOf("${", StringComparison.InvariantCultureIgnoreCase);
                if (varIndexStart == -1)
                    break;

                var varIndexEnd = script.IndexOf('}', varIndexStart + 2);
                var variableName = script.Substring(varIndexStart + 2, varIndexEnd - varIndexStart - 2);
                paramList.Add(variableName);
                script = script.Substring(varIndexEnd + 1);
            }
            return paramList;
        }
    }

    public class SeParseException : Exception
    {
        public SeParseException()
        {
        }

        public SeParseException(string message)
            : base(message)
        {
        }

        public SeParseException(string message, Exception inner)
            : base(message, inner)
        {
        }
    }
}
