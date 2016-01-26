using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Modules
{
	public interface IModule
	{
		bool Initialize(Dictionary<string, string> args, ExecutionContext ctx);
		bool Dispose();
		bool IsInitialized { get; }
		void IterationStarted();
		void IterationEnded();
		string Name { get; }
	}
}
