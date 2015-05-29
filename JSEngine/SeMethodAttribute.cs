using System;

namespace CloudBeat.Oxygen.JSEngine
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class JSVisibleAttribute : Attribute
    {
        public JSVisibleAttribute()
        {
        }
    }
}
