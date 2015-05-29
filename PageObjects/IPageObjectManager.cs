using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen
{
	public interface IPageObjectManager
	{
		string GetLocator(string objectName);
		string GetLocator(string objectName, string pageName);
		bool IdentifyCurrentPage(string title, string url, bool strict);
		string CurrentPageUrl { get; }
		string CurrentPageTitle { get; }
	}
}
