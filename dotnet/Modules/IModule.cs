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
		object IterationStarted();
        object IterationEnded();
		string Name { get; }
	}
}
