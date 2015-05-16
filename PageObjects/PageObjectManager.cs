using CloudBeat.Selenium.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Selenium
{
	public class PageObjectManager
	{
		private IList<PageObject> globalObjects;
		private IList<Page> pages;
		private Dictionary<string, Page> pageHash;
		private string currentPageName;
		private string currentPageUrl;
		private string currentPageTitle;
		public PageObjectManager()
		{
			this.pages = new List<Page>();
			this.pageHash = new Dictionary<string,Page>();
		}
		public PageObjectManager(TestCaseConfiguration config)
		{
			if (config.PageObjects != null && config.PageObjects.Pages != null)
				this.pages = config.PageObjects.Pages.Clone() as Page[];
			if (this.pages == null)
				this.pages = new List<Page>();
			this.pageHash = new Dictionary<string,Page>();
			this.globalObjects = new List<PageObject>();
			// add all pages to the hash
			foreach (var page in this.pages)
				this.pageHash.Add(page.Name, page);
		}
		public string CurrentPageUrl { get { return currentPageUrl; } }
		public string CurrentPageTitle { get { return currentPageTitle; } }
		public void AddObject(PageObject obj)
		{
			globalObjects.Add(obj);
			
		}
		public void AddObjects(PageObjects pageObjects)
		{
			if (pageObjects == null)
				throw new ArgumentNullException("pageObjects");
			if (pageObjects.Pages == null)
				return;
			foreach (var page in pageObjects.Pages)
			{
				this.pageHash.Add(page.Name, page);
				this.pages.Add(page);
			}
				
		}
		public void AddPage(Page page)
		{
			this.pages.Add(page);
			pageHash.Add(page.Name, page);
		}
		public string GetLocator(string objectName)
		{
			// try to find a page specific object first
			var locator = FindCurrentPageObjectLocator(objectName);
			if (locator != null)
				return locator;
			// then try to locate object at the global scope
			return FindGlobalPageObjectLocator(objectName);
		}

		public string GetLocator(string objectName, string pageName)
		{
			// try to find a page specific object first
			var locator = FindPageObjectLocator(objectName, pageName);
			if (locator != null)
				return locator;
			// then try to locate object at the global scope
			return FindGlobalPageObjectLocator(objectName);
		}
		public void IdentifyCurrentPage(string title, string url, bool strict)
		{
			if (pages == null)
				return;
			foreach (var page in pages)
			{
				if (string.IsNullOrEmpty(page.Title) && string.IsNullOrEmpty(page.Url))
					continue; // ignore pages that do not have at least a value for either url or title
				bool hasMatch = false;
				if (string.IsNullOrEmpty(page.Title))
					hasMatch = MatchPageUrl(page.Url, url, strict);
				else if (string.IsNullOrEmpty(page.Url))
					hasMatch = MatchPageTitle(page.Title, title, strict);
				else // match both
					hasMatch = MatchPageTitle(page.Title, title, strict) && MatchPageUrl(page.Url, url, strict);

				if (hasMatch)
				{
					currentPageName = page.Name;
					currentPageTitle = title;
					currentPageUrl = url;
					return;
				}
			}
			// not found
			currentPageName = null;
			currentPageTitle = null;
			currentPageUrl = null;
		}

		private static bool MatchPageUrl(string pattern, string current, bool strict)
		{
			if (strict)
				return pattern == current;
			return current.EndsWith(pattern);
			// TODO add * and regex support
		}

		private static bool MatchPageTitle(string pattern, string current, bool strict)
		{
			return pattern == current;
			// TODO add * and regex support
		}
		public void SetCurrentPage(string pageName)
		{
			this.currentPageName = pageName;
			this.currentPageTitle = null;
			this.currentPageUrl = null;
		}
		private string FindCurrentPageObjectLocator(string objectName)
		{
			if (currentPageName == null)
				return null;
			return FindPageObjectLocator(objectName, currentPageName);
		}
		private string FindPageObjectLocator(string objectName, string pageName)
		{
			if (pageHash == null || pageHash.Count == 0)
				return null;
			var page = pageHash[pageName];
			if (page == null || page.Objects == null)
				return null;
			var obj = page.Objects.Where(o => o.Name == objectName).FirstOrDefault();
			return obj == null ? null : obj.Locator;
		}
		private string FindGlobalPageObjectLocator(string objectName)
		{
			if (globalObjects == null || globalObjects.Count == 0)
				return null;
			var obj = globalObjects.Where(o => o.Name == objectName).FirstOrDefault();
			return obj == null ? null : obj.Locator;
		}
	}
}
