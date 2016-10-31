using log4net;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;

namespace CloudBeat.Oxygen
{
    public class Proxy
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public Process process { get; set; }
        public string proxyAddr { get { return "127.0.0.1"; } }
        public int proxyPort { get; set; }
        private string apiAddr = "localhost"; // possible bug in martian - uses localhost instead of "martian.proxy" when -api-addr is defined
        public int apiPort { get; set; }

        private const int PROXY_CONN_RETRY_COUNT = 10;

        public static Proxy Create()
        {
            int connectAttempt = 0;
            Proxy proxy = new Proxy();

            do {
                try {
                    int proxyPort;
                    int apiPort;
                    GetFreePorts(out proxyPort, out apiPort);
                    proxy.proxyPort = proxyPort;
                    proxy.apiPort = apiPort;
                    proxy.process = new System.Diagnostics.Process();
                    proxy.process.StartInfo.FileName = "proxy.exe";     // should receive path as argument
                    proxy.process.StartInfo.Arguments = "-har=true -har-log-body=false -key=\"proxy_mitm_ca.key\" -cert=\"proxy_mitm_ca.pem\" -api-addr=\":" + proxy.apiPort + "\" -addr=" + proxy.proxyAddr + ":" + proxy.proxyPort;
                    proxy.process.StartInfo.UseShellExecute = false;
                    proxy.process.StartInfo.RedirectStandardOutput = true;
                    // proxy.process.StartInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                    // proxy.process.StartInfo.CreateNoWindow = true;
                    proxy.process.Start();
                    // wait for the process to initialize
                    Thread.Sleep(1000);

                    // process will terminate on error
                    if (proxy.process.HasExited)
                    {
                        connectAttempt++;
                        Thread.Sleep(1000);
                        continue;
                    }

                    break;
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
            var response = MakeRequest(String.Format("http://{0}:{1}/logs/reset", apiAddr, apiPort), "DELETE");
            response.Close();
        }

        public string HarGet()
        {
            using (var response = MakeRequest(String.Format("http://{0}:{1}/logs", apiAddr, apiPort), "GET"))
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

        private static void GetFreePorts(out int port1, out int port2)
        {
            TcpListener l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            TcpListener l2 = new TcpListener(IPAddress.Loopback, 0);
            l2.Start();
            port1 = ((IPEndPoint)l.LocalEndpoint).Port;
            port2 = ((IPEndPoint)l2.LocalEndpoint).Port;
            l2.Stop();
            l.Stop();
        }
    }
}
