using System.Text;

namespace CloudBeat.Oxygen.ProxyClient
{
    public class LimitOptions
    {
        public int? UpstreamKbps { get; set; }
        public int? DownstreamKbps { get; set; }
        public int? Latency { get; set; }
        
        public string ToFormData()
        {
            var builder = new StringBuilder(50);
            string delimiter = "";
            
            if (UpstreamKbps.HasValue)            
            {
                builder.AppendFormat("upstream_kbps={0}", UpstreamKbps.Value);
                delimiter = "&";
            }

            if (DownstreamKbps.HasValue)
            {
                builder.AppendFormat("{0}downstream_kbps={1}", delimiter, DownstreamKbps.Value);
                delimiter = "&";
            }

            if (Latency.HasValue)
                builder.AppendFormat("{0}latency={1}", delimiter, Latency.Value);            

            return builder.ToString();
        }
    }
}