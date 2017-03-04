using CloudBeat.Oxygen.Models;
using System.Collections.Generic;

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
        CommandResult ExecuteCommand(string name, params object[] args);
	}
}
