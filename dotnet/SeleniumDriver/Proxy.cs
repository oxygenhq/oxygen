using log4net;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace CloudBeat.Oxygen
{
    public class Proxy
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public Process process { get; set; }
        public string proxyAddr { get; set; }
        public int proxyPort { get; set; }
        private string apiAddr = "martian.proxy";
        public int apiPort { get; set; }

        private const int PROXY_CONN_RETRY_COUNT = 10;

        public static Proxy Create(string addr, int port)
        {
            int connectAttempt = 0;
            Proxy proxy = new Proxy();

            proxy.proxyAddr = addr;
            proxy.proxyPort = port;
            do {

                try {
                    proxy.process = new System.Diagnostics.Process();
                    proxy.process.StartInfo.FileName = "proxy.exe";     // should receive path as argument
                    proxy.process.StartInfo.Arguments = "-har=true -har-log-body=false -key=\"proxy_mitm_ca.key\" -cert=\"proxy_mitm_ca.pem\" -addr=" + addr + ":" + port;
                    proxy.process.StartInfo.UseShellExecute = false;
                    proxy.process.StartInfo.RedirectStandardOutput = true;
                    // proc.StartInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                    // pProcess.StartInfo.CreateNoWindow = true;
                    proxy.process.Start();
                    // wait for the process to initialize. 
                    Thread.Sleep(1000);

                    // process will terminate on error
                    // TODO
                    if (proxy.process.HasExited)
                    {
                        connectAttempt++;
                        Thread.Sleep(1000);
                        continue;
                    }
            	}
				catch (Exception e)
				{
					log.Fatal("Error connecting to proxy", e);
					throw new Exception("Can't initialize proxy: " + e.Message);
				}
				break;
			} while (connectAttempt < PROXY_CONN_RETRY_COUNT);

            return proxy;
        }

        private HttpWebResponse MakeRequest(string url, string method)
        {
            try
            {
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
                WebProxy proxy = new WebProxy(proxyAddr, proxyPort);
                proxy.BypassProxyOnLocal = false;
                request.Proxy = proxy;
                request.Method = method;
                return (HttpWebResponse)request.GetResponse();
            }
            catch (Exception e)
            {
                Console.Out.WriteLine(e);
            }

            return null;
        }

        public void HarReset()
        {
            var response = MakeRequest(String.Format("http://{0}/logs/reset", apiAddr), "DELETE");
            response.Close();
        }

        public string HarGet()
        {
            using (var response = MakeRequest(String.Format("http://{0}/logs", apiAddr), "GET"))
            {
                using (var responseStream = response.GetResponseStream())
                {
                    if (responseStream == null)
                        return null;

                    using (var responseStreamReader = new StreamReader(responseStream))
                    {
                        return responseStreamReader.ReadToEnd();
                    }
                }
            }
        }

        public void Dispose()
        {
            if (process != null) { 
                process.Kill();
                process.Dispose();
            }
        }
    }
}
