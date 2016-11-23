
namespace CloudBeat.Oxygen.Modules
{
    public abstract class Module
	{
        public string Name { get { return this.GetType().Name.Substring("Module".Length); } }
	}
}
