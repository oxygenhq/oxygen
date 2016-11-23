using log4net;

namespace CloudBeat.Oxygen.Modules
{
    public abstract class Module
	{
        protected static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public string Name { get { return this.GetType().Name.Substring("Module".Length); } }
        protected ExecutionContext ctx;
        public bool IsInitialized { get; protected set; }
	}
}
