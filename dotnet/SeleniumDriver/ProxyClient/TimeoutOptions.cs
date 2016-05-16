using System.Text;

namespace CloudBeat.Oxygen.ProxyClient
{
    public class TimeoutOptions
    {
		public int? RequestTimeout { get; set; }
		public int? ReadTimeout { get; set; }
		public int? ConnectionTimeout { get; set; }
		public int? DnsCacheTimeout { get; set; }
   
        public string ToFormData()
        {
            var builder = new StringBuilder(50);
            string delimiter = "";

			if (RequestTimeout.HasValue)            
            {
				builder.AppendFormat("RequestTimeout={0}", RequestTimeout.Value);
                delimiter = "&";
            }

			if (ReadTimeout.HasValue)
            {
				builder.AppendFormat("{0}ReadTimeout={1}", delimiter, ReadTimeout.Value);
                delimiter = "&";
            }

			if (DnsCacheTimeout.HasValue)
			{
				builder.AppendFormat("{0}DnsCacheTimeout={1}", delimiter, DnsCacheTimeout.Value);
				delimiter = "&";
			}

			if (ConnectionTimeout.HasValue)
				builder.AppendFormat("{0}ConnectionTimeout={1}", delimiter, ConnectionTimeout.Value);            

            return builder.ToString();
        }
    }
}