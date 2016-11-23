using CloudBeat.Oxygen.Models;
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
			var result = new CommandResult(new Command("equal", a, b, message).ToJSCommand(Name));
            result = a != b ? result.ErrorBase(CheckResultStatus.ASSERT) : result.SuccessBase() ;

			if (result.StatusText == CheckResultStatus.ASSERT.ToString())
				result.ErrorMessage = "'" + a + "' is not equal to '" + b + "'";
			return result;
        }

        public CommandResult notEqual(string a, string b, string message)
        {
            var result = new CommandResult(new Command("notEqual", a, b, message).ToJSCommand(Name));
            result = a == b ? result.ErrorBase(CheckResultStatus.ASSERT) : result.SuccessBase();

			if (result.StatusText == CheckResultStatus.ASSERT.ToString())
				result.ErrorMessage = "'" + a + "' is equal to '" + b + "'";

			return result;
        }

        public CommandResult fail(string message)
        {
            var result = new CommandResult(new Command("fail", message).ToJSCommand(Name));
            result = result.ErrorBase(CheckResultStatus.ASSERT);
			result.ErrorMessage = message;
			return result;
        }
	}
}
