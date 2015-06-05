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

        public SeAssertionException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }

    public class SeVerificationException : SeException
    {
        public SeVerificationException()
        {
        }

        public SeVerificationException(string message, Exception innerException)
            : base(message, innerException)
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

		public SeWaitForException(string message, Exception innerException)
			: base(message, innerException)
		{
		}
	}

    public class SeElementNotVisibleException : SeException
    {
        public SeElementNotVisibleException()
        {
        }

        public SeElementNotVisibleException(string message)
            : base(message)
        {
        }

        public SeElementNotVisibleException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }

    public class SeElementNotFoundException : SeException
    {
        public SeElementNotFoundException()
        {
        }

        public SeElementNotFoundException(string message)
            : base(message)
        {
        }

        public SeElementNotFoundException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }

    public class SeCommandNotImplementedException : SeException
	{
		public SeCommandNotImplementedException()
		{
		}

		public SeCommandNotImplementedException(string message, Exception innerException)
			: base(message, innerException)
		{
		}

        public SeCommandNotImplementedException(string message)
            : base(message)
        {
        }
	}

    public class SeInvalidCommandArgumentException : SeException
    {
        public SeInvalidCommandArgumentException()
        {
        }

        public SeInvalidCommandArgumentException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public SeInvalidCommandArgumentException(string message)
            : base(message)
        {
        }
    }

    public class SeElementHasNoValueException : SeException
    {
        public SeElementHasNoValueException()
        {
        }

        public SeElementHasNoValueException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public SeElementHasNoValueException(string message)
            : base(message)
        {
        }
    }

    public class SeParameterizationCSVException : Exception
    {
        public SeParameterizationCSVException()
        {
        }

        public SeParameterizationCSVException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        public SeParameterizationCSVException(string message)
            : base(message)
        {
        }
    }
}
