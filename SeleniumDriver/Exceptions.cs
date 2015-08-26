using System;

namespace CloudBeat.Oxygen
{
    public class OxException : Exception
    {
        public OxException()
        {
        }

        public OxException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public OxException(string message)
            : base(message)
        {
        }
    }

	public class OxConnectionException : OxException
	{
		public OxConnectionException(string seleniumUrl)
			: base("Can't connect to selenium server: " + seleniumUrl)
        {
        }
	}
	public class OxProxyException : OxException
	{
		public OxProxyException(string proxyUrl)
			: base("Can't initialize or connect to proxy server: " + proxyUrl)
		{
		}
	}

	public class OxSetWindowSizeException : OxException
	{
		public OxSetWindowSizeException()
			: base ("SetWindowSize funcion failed")
        {
        }
	}

    public class OxVariableUndefined : OxException
    {
        public OxVariableUndefined(string variableName)
            : base("Variable '" + variableName + "' is not defined.")
        {
        }
    }

    public class OxLocatorUndefined : OxException
    {
        public OxLocatorUndefined(string objectName)
            : base("Locator '" + objectName + "' is not found.")
        {
        }
    }

    public class OxAssertionException : OxException
    {
        public OxAssertionException()
        {
        }
    }

    public class OxVerificationException : OxException
    {
        public OxVerificationException()
        {
        }
    }

    public class OxWaitForException : OxException
	{
		public OxWaitForException()
		{
		}

        public OxWaitForException(string message)
            : base(message)
        {
        }
	}

    public class OxTimeoutException : OxException
    {
        public OxTimeoutException()
        {
        }

        public OxTimeoutException(string message)
            : base(message)
        {
        }
    }

    public class OxElementNotVisibleException : OxException
    {
        public OxElementNotVisibleException()
            : base("Element not visible.")
        {
        }
    }

    public class OxElementNotFoundException : OxException
    {
        public OxElementNotFoundException()
            : base("Element not found.")
        {
        }
    }

    public class OxCommandNotImplementedException : OxException
	{
		public OxCommandNotImplementedException()
		{
		}

        public OxCommandNotImplementedException(string message)
            : base(message)
        {
        }
	}

    public class OxOperationException : OxException
    {
        public OxOperationException(string message, Exception innerException) 
            : base(BeautifyMessage(message), innerException)
        {
        }

        private static string BeautifyMessage(string message)
        {
            // strip session info
            int i = message.IndexOf("(Session info:");
            return i > 0 ? message.Substring(0, i) : message;
        }
    }

    public class OxInvalidCommandArgumentException : OxException
    {
        public OxInvalidCommandArgumentException(string message)
            : base(message)
        {
        }
    }

    public class OxElementHasNoValueException : OxException
    {
        public OxElementHasNoValueException(string target)
            : base("Element '" + target + "' has no type; is it really an input?")
        {
        }
    }

    public class OxParameterizationCSVException : Exception
    {
        public OxParameterizationCSVException(string message)
            : base(message)
        {
        }
    }

    public class OxXMLExtractException : OxException
    {
        public OxXMLExtractException(string message)
            : base(message)
        {
        }
    }

    public class OxXMLtoJSONConvertException : OxException
    {
        public OxXMLtoJSONConvertException(string message)
            : base(message)
        {
        }
    }

    public class OxBrowserJSExecutionException : OxException
    {
        public OxBrowserJSExecutionException(string message, Exception innerException) 
            : base(BeautifyMessage(message), innerException)
        {
        }

        private static string BeautifyMessage(string message)
        {
            // strip session info
            int i = message.IndexOf("(Session info:");
            return i > 0 ? message.Substring(0, i) : message;
        }
    }

    public class OxDuplicateTransactionException : OxException
    {
        public OxDuplicateTransactionException()
        {
        }

        public OxDuplicateTransactionException(string message)
            : base(message)
        {
        }
    }
}
