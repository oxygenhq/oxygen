using System;
using System.IO;
using System.Net;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CloudBeat.Oxygen.ProxyClient
{
    public class BMPClient
    {
        private readonly string _url;
        private readonly int _port;
        private readonly string _proxy;
        private readonly string _baseUrlProxy;

        public BMPClient(string url)
        {
            if (String.IsNullOrEmpty(url))
                throw new ArgumentException("url not supplied", "url");

            _url = url;
            _baseUrlProxy = String.Format("{0}/proxy", _url);
            using (var response = MakeRequest(_baseUrlProxy, "POST", "trustAllServers=true"))
            {
                var responseStream = response.GetResponseStream();
                if (responseStream == null)
                    throw new Exception("No response from proxy");

                using (var responseStreamReader = new StreamReader(responseStream))
                {
                    var jsonReader = new JsonTextReader(responseStreamReader);
                    var token = JToken.ReadFrom(jsonReader);
                    var portToken = token.SelectToken("port");                    
                    if (portToken == null) 
                        throw new Exception("No port number returned from proxy");

                    _port = (int) portToken;
                }            
            }

            var parts = url.Split(':');
            _proxy = parts[1].TrimStart('/') + ":" + _port;
        }

        public string NewHar(bool captureHeaders = false, bool captureContent = false, bool captureBinaryContent = false)
        {
            var harOptions = new HarOptions { 
                CaptureHeaders = captureHeaders,
                CaptureContent = captureContent,
                CaptureBinaryContent = captureBinaryContent,
            };

            using (var response = MakeRequest(String.Format("{0}/{1}/har", _baseUrlProxy, _port), "PUT", harOptions.ToFormData())) 
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

        private static WebResponse MakeRequest(string url, string method, string reference = null)
        {
            var request = (HttpWebRequest) WebRequest.Create(url);     
            request.Method = method;
            if (reference != null)
            {
                byte[] requestBytes = Encoding.UTF8.GetBytes(reference);
                using (var requestStream = request.GetRequestStream())
                {
                    requestStream.Write(requestBytes, 0, requestBytes.Length);
                    requestStream.Close();
                }

                request.ContentType = "application/x-www-form-urlencoded";
            }
            else
                request.ContentLength = 0;
            return request.GetResponse();
        }

        private static WebResponse MakeJsonRequest(string url, string method, string payload)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = method;
            
            if (payload != null)
            {
                request.ContentType = "text/json";
                request.ContentLength = payload.Length;
                using (var streamWriter = new StreamWriter(request.GetRequestStream()))
                {
                    streamWriter.Write(payload);
                    streamWriter.Flush();
                    streamWriter.Close();
                }
            }
            else
                request.ContentLength = 0;

            return request.GetResponse();           
        }

        public void NewPage(string pageRef)
        {
            var response = MakeRequest(String.Format("{0}/{1}/har/pageRef", _baseUrlProxy, _port), "PUT", "pageRef=" + pageRef);
            response.Close();
        }

        public string GetHarJson()
        {
            using (var response = MakeRequest(String.Format("{0}/{1}/har", _baseUrlProxy, _port), "GET"))
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
       
        public void SetLimits(LimitOptions options)
        {
            if (options == null)
                throw new ArgumentNullException("options", "LimitOptions must be supplied");

            var response = MakeRequest(String.Format("{0}/{1}/limit", _baseUrlProxy, _port), "PUT", options.ToFormData());
            response.Close();
        }

        public string SeleniumProxy
        {
            get { return _proxy; }
        }       

        public void RemapHost(string host, string ipAddress)
        {
            var response = MakeJsonRequest(String.Format("{0}/{1}/hosts", _baseUrlProxy, _port), "POST", "{\"" + host + "\":\"" + ipAddress + "\"}");
            response.Close();
        }

		public void SetTimeouts(TimeoutOptions options)
		{
			if (options == null)
				throw new ArgumentNullException("options", "TimeoutOptions must be supplied");

			var response = MakeRequest(String.Format("{0}/{1}/timeout", _baseUrlProxy, _port), "PUT", options.ToFormData());
			response.Close();
		}

        public void Close()
        {
            var response = MakeRequest(String.Format("{0}/{1}", _baseUrlProxy, _port), "DELETE");
            response.Close();
        }
    }
}















