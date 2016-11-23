using log4net.Core;
using System.Collections.Generic;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleLog : Module, IModule
	{
        public delegate void ExecutedEventHandler(string msg, Level level);
        public event ExecutedEventHandler CommandExecuted;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        private bool initialized = false;
        private ExecutionContext ctx;

        public ModuleLog()
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
            initialized = true;
            return true;
        }

        public bool Dispose()
        {
            return true;
        }

        public bool IsInitialized { get { return initialized; } }

        public void info(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Info);
        }

        public void error(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Error);
        }

        public void debug(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Debug);
        }

        public void warn(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Warn);
        }

        public void fatal(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Fatal);
        }

        private void _CommandExecuting()
        {
            if (CommandExecuting != null)
                CommandExecuting();
        }
	}
}
