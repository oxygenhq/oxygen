using System;

namespace CloudBeat.Oxygen
{
    public class SeException : Exception
    {
        public SeException()
        {
        }

        public SeException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public SeException(string message)
            : base(message)
        {
        }
    }

	public class SeConnectionException : SeException
	{
		public SeConnectionException(string seleniumUrl)
			: base("Can't connect to selenium server: " + seleniumUrl)
        {
        }
	}
	public class SeProxyException : SeException
	{
		public SeProxyException(string proxyUrl)
			: base("Can't initialize or connect to proxy server: " + proxyUrl)
		{
		}
	}

	public class SeSetWindowSizeException : SeException
	{
		public SeSetWindowSizeException()
			: base ("SetWindowSize funcion failed")
        {
        }
	}

    public class SeVariableUndefined : SeException
    {
        public SeVariableUndefined(string variableName)
            : base("Variable '" + variableName + "' is not defined.")
        {
        }
    }

    public class SeLocatorUndefined : SeException
    {
        public SeLocatorUndefined(string objectName)
            : base("Locator '" + objectName + "' is not found.")
        {
        }
    }

    public class SeAssertionException : SeException
    {
        public SeAssertionException()
        {
        }
    }

    public class SeVerificationException : SeException
    {
        public SeVerificationException()
        {
        }
    }

    public class SeWaitForException : SeException
	{
		public SeWaitForException()
		{
		}

        public SeWaitForException(string message)
            : base(message)
        {
        }
	}

    public class SeElementNotVisibleException : SeException
    {
        public SeElementNotVisibleException()
            : base("Element not visible.")
        {
        }
    }

    public class SeElementNotFoundException : SeException
    {
        public SeElementNotFoundException()
            : base("Element not found.")
        {
        }
    }

    public class SeCommandNotImplementedException : SeException
	{
		public SeCommandNotImplementedException()
		{
		}

        public SeCommandNotImplementedException(string message)
            : base(message)
        {
        }
	}

    public class SeInvalidOperationException : SeException
    {
        public SeInvalidOperationException(string message, Exception innerException) 
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

    public class SeInvalidCommandArgumentException : SeException
    {
        public SeInvalidCommandArgumentException(string message)
            : base(message)
        {
        }
    }

    public class SeElementHasNoValueException : SeException
    {
        public SeElementHasNoValueException(string target)
            : base("Element '" + target + "' has no type; is it really an input?")
        {
        }
    }

    public class SeParameterizationCSVException : Exception
    {
        public SeParameterizationCSVException(string message)
            : base(message)
        {
        }
    }

    public class SeXMLExtractException : SeException
    {
        public SeXMLExtractException(string message)
            : base(message)
        {
        }
    }

    public class SeXMLtoJSONConvertException : SeException
    {
        public SeXMLtoJSONConvertException(string message)
            : base(message)
        {
        }
    }
}
