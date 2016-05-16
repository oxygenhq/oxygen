
namespace CloudBeat.Oxygen
{
	public interface IPageObjectManager
	{
		string GetLocator(string objectName);
		string GetLocator(string objectName, string pageName);
		bool IdentifyCurrentPage(string title, string url);
		string CurrentPageUrl { get; }
		string CurrentPageTitle { get; }
	}
}
