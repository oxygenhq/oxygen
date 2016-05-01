using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Models
{
    public class CommandResult
    {
        public string CommandName { get; set; }
        public int? CommandOrder { get; set; }
        public string StatusText { get; set; }
        public string StatusData { get; set; }
        public bool IsSuccess { get; set; }
        public bool IsAction { get; set; }
        public string TransactionName { get; set; }
        public string Screenshot { get; set; }
        public string Har { get; set; }
        public int DomContentLoadedEvent { get; set; }
        public int LoadEvent { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double Duration { get; set; }
        public object ReturnValue { get; set; }
        public string ErrorType { get; set; }
        public string ErrorMessage { get; set; }
        public string ErrorDetails { get; set; }

        public CommandResult()
        {
        }

        public CommandResult(string CommandName)
        {
            this.StartTime = DateTime.UtcNow;
            this.CommandName = CommandName;
        }

        public CommandResult ErrorBase(CheckResultStatus status, string statusData = null)
        {
            this.EndTime = DateTime.UtcNow;
            this.Duration = (this.EndTime - this.StartTime).TotalSeconds;
            this.IsSuccess = false;
            this.StatusText = status.ToString();
            this.StatusData = statusData;
            return this;
        }

        public CommandResult SuccessBase()
        {
            this.EndTime = DateTime.UtcNow;
            this.Duration = (this.EndTime - this.StartTime).TotalSeconds;
            this.IsSuccess = true;
            return this;
        }
    }
}
