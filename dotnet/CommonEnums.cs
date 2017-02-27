
namespace CloudBeat.Oxygen
{
    public enum CheckResultStatus
    {
        NO_ELEMENT,
        ASSERT,
		VERIFICATION,
        SCRIPT_TIMEOUT,
        UNHANDLED_ALERT,
        ELEMENT_NOT_VISIBLE,
		FRAME_NOT_FOUND,
        STALE_ELEMENT,
        SOAP,
        DB_CONNECTION,
        DB_QUERY,
        VARIABLE_NOT_DEFINED,
        UNKNOWN_PAGE_OBJECT,
		UNKNOWN_ERROR,
		COMMAND_NOT_IMPLEMENTED,
        // misc InvalidOperationExceptions such as "Element is not clickable at point (x, y). Other element would receive the click"
        INVALID_OPERATION,
        XML_ERROR,
        NO_ALERT_PRESENT,
        BROWSER_JS_EXECUTE_ERROR,
        DUPLICATE_TRANSACTION,
        NAVIGATE_TIMEOUT,            // load event did not fire. this might also happen due to a bug in chromedriver.
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
