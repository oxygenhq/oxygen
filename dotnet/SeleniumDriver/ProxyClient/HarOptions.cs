using System.Text;

namespace CloudBeat.Oxygen.ProxyClient
{
    public class HarOptions
    {
        public bool CaptureHeaders { get; set; }
        public bool CaptureContent { get; set; }
        public bool CaptureBinaryContent { get; set; }
        
        public string ToFormData()
        {
            var builder = new StringBuilder(50);
            string delimiter = "";

            if (CaptureHeaders)            
            {
                builder.Append("captureHeaders=true");
                delimiter = "&";
            }

            if (CaptureContent)
            {
                builder.AppendFormat("{0}captureContent=true", delimiter);
                delimiter = "&";
            }

            if (CaptureBinaryContent)
                builder.AppendFormat("{0}captureBinaryContent=true", delimiter);            

            return builder.ToString();
        }
    }
}