using System;

namespace CloudBeat.Oxygen.JSEngine
{
    public class ModuleAssert
	{
        public delegate void ExceptionEventHandler(Exception e, string cmd, DateTime startTime, CheckResultStatus status);
        public event ExceptionEventHandler CommandException;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        public ModuleAssert()
        {
        }

        [JSVisible]
        public void equal(string a, string b, string message)
        {
            _CommandExecuting();
            if (a != b)
                if (CommandException != null)
					CommandException(new Exception(message), string.Format("assert.equal(\"{0}\", \"{1}\")", a, b), DateTime.UtcNow, CheckResultStatus.ASSERT);
                else
                    throw new Exception(message);
        }

        [JSVisible]
        public void notEqual(string a, string b, string message)
        {
            _CommandExecuting();
            if (a == b)
                if (CommandException != null)
					CommandException(new Exception(message), string.Format("assert.notEqual(\"{0}\", \"{1}\")", a, b), DateTime.UtcNow, CheckResultStatus.ASSERT);
                else
                    throw new Exception(message);
        }

        [JSVisible]
        public void fail(string message)
        {

            _CommandExecuting();
            if (CommandException != null)
				CommandException(new Exception(message), "assert.fail()", DateTime.UtcNow, CheckResultStatus.ASSERT);
            else
                throw new Exception(message);
        }

        private void _CommandExecuting()
        {
            if (CommandExecuting != null)
                CommandExecuting();
        }
	}
}
