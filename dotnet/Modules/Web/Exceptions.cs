/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using System;

namespace CloudBeat.Oxygen.Modules
{
	public class OxSetWindowSizeException : OxException
	{
		public OxSetWindowSizeException()
        {
        }

        public OxSetWindowSizeException(string message)
            : base(message)
        {
        }
	}

    public class OxAssertionException : OxException
    {
        public OxAssertionException()
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

        public OxElementNotFoundException(string message)
            : base(message)
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

    public class OxUnknownException : OxException
    {
        public OxUnknownException()
        {
        }

        public OxUnknownException(string message)
            : base(message)
        {
        }

        public OxUnknownException(string message, Exception innerException)
            : base(message, innerException)
        {
        }
    }
}
