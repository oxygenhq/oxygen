using System;

namespace CloudBeat.Selenium.JSEngine
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class JSVisibleAttribute : Attribute
    {
        public JSVisibleAttribute()
        {
        }
    }
}
