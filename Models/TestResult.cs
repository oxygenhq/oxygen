using System;
using System.Collections.Generic;
using System.Xml.Serialization;

namespace CloudBeat.Oxygen.Models
{
	public class TestResult
	{
		public string TestId { get; set; }
		public string TestName { get; set; }
		public string BrowserName { get; set; }
		public DateTime StartTime { get; set; }
		public DateTime EndTime { get; set; }
		public int Retries { get; set; }
		public bool IsSuccess { get; set; }
		public string FailureReason { get; set; }
		public string FailureDetails { get; set; }
		[XmlArray]
		[XmlArrayItem(ElementName="Iteration", Type=typeof(TestIteration))]
		public IList<TestIteration> Iterations = new List<TestIteration>();

		public class TestIteration
		{
			public int SequenceNumber { get; set; }
			public bool IsSuccess { get; set; }
			[XmlArray]
			[XmlArrayItem(ElementName = "TestCaseResult", Type = typeof(TestCaseResult))]
			public IList<TestCaseResult> TestCases = new List<TestCaseResult>();
		}
	}
	public class TestCaseResult
	{
		public string BrowserName { get; set; }
		public string TestCaseId { get; set; }
		public string TestCaseName { get; set; }
		public DateTime StartTime { get; set; }
		public DateTime EndTime { get; set; }
		public bool IsSuccess { get; set; }
		[XmlArray]
		[XmlArrayItem(ElementName = "TestCaseIteration", Type = typeof(TestCaseIteration))]
		public List<TestCaseIteration> Iterations = new List<TestCaseIteration>();

		public class TestCaseIteration
		{
			public int SequenceNumber { get; set; }
			public DateTime StartTime { get; set; }
			public DateTime EndTime { get; set; }
			public bool IsSuccess { get; set; }
			public string FailureReason { get; set; }
			public string FailureDetails { get; set; }
			public int Retries { get; set; }
			[XmlArray("Steps")]
			[XmlArrayItem(ElementName = "Step", Type = typeof(StepResult))]
			public List<StepResult> Steps = new List<StepResult>();
            public string Har { get; set; }
		}
	}
}
