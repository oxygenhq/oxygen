using log4net.Core;

namespace CloudBeat.Selenium.JSEngine
{
    public class ModuleLog
	{
        public delegate void ExecutedEventHandler(string msg, Level level);
        public event ExecutedEventHandler CommandExecuted;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        public ModuleLog()
        {
        }

        [JSVisible]
        public void info(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Info);
        }

        [JSVisible]
        public void error(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Error);
        }

        [JSVisible]
        public void debug(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Debug);
        }

        [JSVisible]
        public void warn(string msg)
        {
            _CommandExecuting();
            if (CommandExecuted != null)
                CommandExecuted(msg, Level.Warn);
        }

        [JSVisible]
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
