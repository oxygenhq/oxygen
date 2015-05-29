using Newtonsoft.Json;
using System;
using System.CodeDom;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Web.Services.Description;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.JSEngine
{
    public class ModuleSoap
	{
        public delegate void ExceptionEventHandler(Exception e, string cmd, DateTime startTime, CheckResultStatus status);
        public event ExceptionEventHandler CommandException;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        private string command;

        public ModuleSoap()
        {
        }

        [JSVisible]
        public string get(string wsdlUrl, string serviceName, string methodName)
        {
            command = GenerateCmd("soap.get", wsdlUrl, serviceName, methodName);
            return get(wsdlUrl, serviceName, methodName, new object[] { }, "Soap");
        }

        [JSVisible]
        public string get12(string wsdlUrl, string serviceName, string methodName)
        {
            command = GenerateCmd("soap.get12", wsdlUrl, serviceName, methodName);
            return get(wsdlUrl, serviceName, methodName, new object[] { }, "Soap12");
        }

        [JSVisible]
        public string get(string wsdlUrl, string serviceName, string methodName, object[] args)
        {
            command = GenerateCmd("soap.get", wsdlUrl, serviceName, methodName, args);
            return get(wsdlUrl, serviceName, methodName, args, "Soap");
        }

        [JSVisible]
        public string get12(string wsdlUrl, string serviceName, string methodName, object[] args)
        {
            command = GenerateCmd("soap.get12", wsdlUrl, serviceName, methodName, args);
            return get(wsdlUrl, serviceName, methodName, args, "Soap12");
        }
        
        private string get(string wsdlUrl, string serviceName, string methodName, object[] args, string soap)
        {
            if (CommandExecuting != null)
                CommandExecuting();

            try
            {
                // read the WSDL file describing a service
                WebClient client = new WebClient();
                Stream stream = client.OpenRead(wsdlUrl);
                ServiceDescription description = ServiceDescription.Read(stream);

                // initialize a service description importer
                ServiceDescriptionImporter importer = new ServiceDescriptionImporter();
                importer.ProtocolName = soap; // "Soap12" for SOAP 1.2
                importer.CodeGenerationOptions = CodeGenerationOptions.None;
                importer.AddServiceDescription(description, null, null);

                // download and inject any imported schemas   
                try
                {
                    foreach (XmlSchema wsdlSchema in description.Types.Schemas)
                    {
                        // loop through all detected imports in the main schema
                        foreach (XmlSchemaObject externalSchema in wsdlSchema.Includes)
                        {
                            // read each external schema into a schema object and add to importer
                            if (externalSchema is XmlSchemaImport)
                            {
                                Uri baseUri = new Uri(wsdlUrl);
                                Uri schemaUri = new Uri(baseUri, ((XmlSchemaExternal)externalSchema).SchemaLocation);

                                Stream schemaStream = client.OpenRead(schemaUri);
                                XmlSchema schema = XmlSchema.Read(schemaStream, null);
                                importer.Schemas.Add(schema);
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    // ignore errors for now
                }

                // generate a proxy client
                importer.Style = ServiceDescriptionImportStyle.Client;
                importer.CodeGenerationOptions = CodeGenerationOptions.GenerateProperties;

                // initialize a Code-DOM tree into which we will import the service
                CodeNamespace ns = new CodeNamespace();
                CodeCompileUnit cu = new CodeCompileUnit();
                cu.Namespaces.Add(ns);

                // import the service into the Code-DOM tree. this creates proxy code that uses the service.
                ServiceDescriptionImportWarnings warning = importer.Import(ns, cu);

                if (warning == 0)
                {
                    // generate the proxy code
                    CodeDomProvider provider = CodeDomProvider.CreateProvider("CSharp");

                    // compile the assembly proxy with the appropriate references
                    string[] assemblyReferences = new string[] { "System.dll", "System.Web.Services.dll", "System.Web.dll", "System.Xml.dll", "System.Data.dll" };
                    CompilerParameters parms = new CompilerParameters(assemblyReferences);

                    CompilerResults results = provider.CompileAssemblyFromDom(parms, cu);

                    if (results.Errors.HasErrors)
                    {
                        IList<string> errorTexts = new List<string>();
                        foreach (CompilerError oops in results.Errors)
                            errorTexts.Add(oops.ErrorText);

                        if (CommandException != null)
                            CommandException(new Exception("Compile Error: " + string.Join(":", errorTexts)), command, DateTime.UtcNow, CheckResultStatus.SOAP);
                        else 
                            throw new Exception("SOAP: Compile Error: " + string.Join(":", errorTexts));

                        return null;
                    }

                    object wsvcClass = results.CompiledAssembly.CreateInstance(serviceName);
                    MethodInfo mi = wsvcClass.GetType().GetMethod(methodName);
                    var result = mi.Invoke(wsvcClass, args);
                    return JsonConvert.SerializeObject(result);
                }
                else
                {
                    if (CommandException != null)
						CommandException(new Exception("Import Error"), command, DateTime.UtcNow, CheckResultStatus.SOAP);
                    else 
                        throw new Exception("SOAP: Import Error");

                    return null;
                }
            }
            catch (Exception e)
            {
                if (CommandException != null)
					CommandException(e, command, DateTime.UtcNow, CheckResultStatus.SOAP);
                else
                    throw;
            }

            return null;
        }

        private string GenerateCmd(string name, params object[] prms)
        {
            string prmsString = "";
            for (int i = 0; i < prms.Length; i++) 
                prmsString += "\"" + prms[i] + "\", ";
            prmsString = prmsString.Substring(0, prmsString.Length-2);

            return name + "(" + prmsString + ")";
        }
	}
}
