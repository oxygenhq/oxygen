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

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleSoap : Module, IModule
	{
        public ModuleSoap()
        {
        }

        public object IterationStarted()
        {
            return null;
        }

        public object IterationEnded()
        {
            return null;
        }

        public bool Initialize(Dictionary<string, string> args, ExecutionContext ctx)
        {
            this.ctx = ctx;
            IsInitialized = true;
            return true;
        }

        public bool Dispose()
        {
            return true;
        }

        public CommandResult get(string wsdlUrl, string serviceName, string methodName)
        {
            var result = new CommandResult(Name, "get", wsdlUrl, serviceName, methodName);
            return get(wsdlUrl, serviceName, methodName, new object[] { }, "Soap", result);
        }

        public CommandResult get12(string wsdlUrl, string serviceName, string methodName)
        {
            var result = new CommandResult(Name, "get12", wsdlUrl, serviceName, methodName);
            return get(wsdlUrl, serviceName, methodName, new object[] { }, "Soap12", result);
        }

        public CommandResult get(string wsdlUrl, string serviceName, string methodName, object[] args)
        {
            var result = new CommandResult(Name, "get", wsdlUrl, serviceName, methodName, args);
            return get(wsdlUrl, serviceName, methodName, args, "Soap", result);
        }

        public CommandResult get12(string wsdlUrl, string serviceName, string methodName, object[] args)
        {
            var result = new CommandResult(Name, "get12", wsdlUrl, serviceName, methodName, args);
            return get(wsdlUrl, serviceName, methodName, args, "Soap12", result);
        }

        private CommandResult get(string wsdlUrl, string serviceName, string methodName, object[] args, string soap, CommandResult result)
        {
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
                        return result.ErrorBase(CheckResultStatus.SOAP, "Compile Error: " + string.Join(":", errorTexts));
                    }

                    object wsvcClass = results.CompiledAssembly.CreateInstance(serviceName);
                    if (wsvcClass == null)
                        return result.ErrorBase(CheckResultStatus.SOAP, "Invalid service name");
                    MethodInfo mi = wsvcClass.GetType().GetMethod(methodName);
                    if (mi == null)
                        return result.ErrorBase(CheckResultStatus.SOAP, "Invalid method name");
                    var reqResult = mi.Invoke(wsvcClass, args);
                    var cmdRes = result.SuccessBase();
                    cmdRes.ReturnValue = JsonConvert.SerializeObject(reqResult);
                    return cmdRes;
                }
                else
                {
                    return result.ErrorBase(CheckResultStatus.SOAP, "Import Error");
                }
            }
            catch (Exception e)
            {
                return result.ErrorBase(CheckResultStatus.SOAP, e.Message);
            }
        }
	}
}
