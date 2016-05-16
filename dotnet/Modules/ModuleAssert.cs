using CloudBeat.Oxygen.Models;
using System.Collections.Generic;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleAssert : IModule
	{
        private bool initialized = false;
        private ExecutionContext ctx;

        public ModuleAssert()
        {
        }

        public string Name { get { return "Assert"; } }

        public object IterationStarted()
        {
            return null;
        }

        public object IterationEnded()
        {
            return null;
        }

        public bool Initialize(Dictionary<string, string> args, ExecutionContext ctx)
        {
            this.ctx = ctx;
            initialized = true;
            return true;
        }

        public bool Dispose()
        {
            return true;
        }

        public bool IsInitialized { get { return initialized; } }

        public CommandResult equal(string a, string b, string message)
        {
            var result = new CommandResult(new SeCommand("equal", a, b, message).ToJSCommand());
            return a != b ? result.ErrorBase(CheckResultStatus.ASSERT) : result.SuccessBase() ;
        }

        public CommandResult notEqual(string a, string b, string message)
        {
            var result = new CommandResult(new SeCommand("notEqual", a, b, message).ToJSCommand());
            return a == b ? result.ErrorBase(CheckResultStatus.ASSERT) : result.SuccessBase();
        }

        public CommandResult fail(string message)
        {
            var result = new CommandResult(new SeCommand("fail", message).ToJSCommand());
            return result.ErrorBase(CheckResultStatus.ASSERT);
        }
	}
}
