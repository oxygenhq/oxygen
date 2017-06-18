using System;
using System.IO;
using System.Reflection;
using System.Xml.Xsl;

namespace XSLTransform
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.Error.WriteLine("At least one argument is required");
                Environment.Exit(1);
            }

            string xslFile = null; 
            string xmlFile = args[0];

            if (args.Length == 1)
                xslFile = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "template.xsl");
                //xslFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "template.xsl");
            else
                xslFile = args[1];

            string targetHtmlFile = Path.Combine(Path.GetDirectoryName(xmlFile), Path.GetFileNameWithoutExtension(xmlFile) + ".htm"); //args[2];

            try
            {
                XslCompiledTransform xslTrans = new XslCompiledTransform();
                xslTrans.Load(xslFile, XsltSettings.TrustedXslt, null);
                xslTrans.Transform(xmlFile, targetHtmlFile);
            }
            catch (Exception e)
            {
                Console.Error.Write(e);
                Environment.Exit(1);
            }
        }
    }
}
