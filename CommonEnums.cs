
namespace CloudBeat.Oxygen
{
    public enum CheckResultStatus
    {
        NO_ELEMENT,
        ASSERT,
        SCRIPT_TIMEOUT,
        PERFORMANCE_TIMINGS_ERROR,
        UNHANDLED_ALERT,
        ELEMENT_NOT_VISIBLE,
		FRAME_NOT_FOUND,
        STALE_ELEMENT,
        SOAP,
        DB,
        JS_EVALUATE_ERROR,
        VARIABLE_NOT_DEFINED,
        UNKNOWN_OBJECT,
		UNKNOWN_ERROR,
		COMMAND_NOT_IMPLEMENTED,
        // misc InvalidOperationExceptions such as "Element is not clickable at point (x, y). Other element would receive the click"
        INVALID_OPERATION
    }
}
