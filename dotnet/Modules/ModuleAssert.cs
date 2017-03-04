using System.Collections.Generic;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleAssert : Module, IModule
	{
        public ModuleAssert()
        {
        }

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
            IsInitialized = true;
            return true;
        }

        public bool Dispose()
        {
            return true;
        }

        public CommandResult equal(string a, string b, string message)
        {
            var result = new CommandResult(Name, "equal", a, b, message);
            return a != b ? 
                result.ErrorBase(CheckResultStatus.ASSERT, "'" + a + "' is not equal to '" + b + "'") :
                result.SuccessBase();
        }

        public CommandResult notEqual(string a, string b, string message)
        {
            var result = new CommandResult(Name, "notEqual", a, b, message);
            return a == b ?
                result.ErrorBase(CheckResultStatus.ASSERT, "'" + a + "' is equal to '" + b + "'") :
                result.SuccessBase();
        }

        public CommandResult fail(string message)
        {
            var result = new CommandResult(Name, "fail", message);
			return result.ErrorBase(CheckResultStatus.ASSERT, message);
        }
	}
}
