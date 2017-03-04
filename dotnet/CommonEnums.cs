
namespace CloudBeat.Oxygen
{
    public enum CheckResultStatus
    {
        // general
        VARIABLE_NOT_DEFINED,
        UNKNOWN_PAGE_OBJECT,
        UNKNOWN_ERROR,
        COMMAND_NOT_IMPLEMENTED,
        // web
        NO_ELEMENT,
        ASSERT,
		VERIFICATION,
        SCRIPT_TIMEOUT,
        UNHANDLED_ALERT,
        ELEMENT_NOT_VISIBLE,
		FRAME_NOT_FOUND,
        STALE_ELEMENT,
        INVALID_OPERATION,  // misc InvalidOperationExceptions such as "Element is not clickable at point (x, y). Other element would receive the click"
        XML_ERROR,
        NO_ALERT_PRESENT,
        BROWSER_JS_EXECUTE_ERROR,
        NAVIGATE_TIMEOUT,   // load event did not fire. this might also happen due to a bug in chromedriver.
        // soap
        SOAP,
        // db
        DB_CONNECTION,
        DB_QUERY,
        DUPLICATE_TRANSACTION,
        // eyes
        APPLITOOLS
    }
	public enum ScreenshotMode
	{
		Never,
		OnError,
		OnAction,	// if step is action or error occured
		Always
	}
}
