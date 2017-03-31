/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using System;
using System.Data.Odbc;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleDB : Module, IModule
	{
        private string connString;

		const string ARG_CONN_STR = "db@connString";

        public ModuleDB()
        {
        }

        public CommandResult setConnectionString(string connString)
        {
            this.connString = connString;

            var result = new CommandResult(Name, "setConnectionString", connString);
            return result.SuccessBase();
        }

        public CommandResult getScalar(string query)
        {
            var result = new CommandResult(Name, "getScalar", query);
            try
            {
                var conn = Connect();
                OdbcCommand cmd = new OdbcCommand(query, conn);
                var retVal = cmd.ExecuteScalar();
                conn.Close();
                result = result.SuccessBase(retVal);
            }
            catch (Exception e)
            {
                return ErrorResult(e, result);
            }
            return result;
        }

        public CommandResult executeNonQuery(string query)
        {
            var result = new CommandResult(Name, "executeNonQuery", query);
            try
            {
                var conn = Connect();
                OdbcCommand cmd = new OdbcCommand(query, conn);
                cmd.ExecuteNonQuery();
                conn.Close();
                result = result.SuccessBase();
            }
            catch (Exception e)
            {
                return ErrorResult(e, result);
            }

            return result;
        }

        private OdbcConnection Connect()
        {
            try
            {
                OdbcConnection conn = new OdbcConnection(connString);
                conn.Open();
                return conn;
            }
            catch (Exception e)
            {
                throw new OxDBConnectionException(e.Message, e);
            }
        }

		public bool Initialize(System.Collections.Generic.Dictionary<string, string> args, ExecutionContext ctx)
		{
			this.ctx = ctx;

			if (args.ContainsKey(ARG_CONN_STR))
				connString = args[ARG_CONN_STR];

			IsInitialized = true;

			return true;
		}

		public bool Dispose()
		{
			return true;
		}

		public object IterationStarted()
		{
			return null;
		}

		public object IterationEnded()
		{
			return null;
		}

        private CommandResult ErrorResult(Exception e, CommandResult result)
        {
            var type = e.GetType();

            ErrorType errType;
            string errMsg = null;

            if (type == typeof(OxDBConnectionException))
            {
                errType = ErrorType.DB_CONNECTION;
                errMsg = e.Message;
            }
            else if (type == typeof(OdbcException))
            {
                errType = ErrorType.DB_QUERY;
                errMsg = e.Message;
            }
            else
            {
                errType = ErrorType.UNKNOWN_ERROR;
                result.ErrorStackTrace = e.StackTrace;
                errMsg = e.GetType().Name + ": " + e.Message;
            }

            return result.ErrorBase(errType, errMsg);
        }
	}

    public class OxDBConnectionException : OxException
    {
        public OxDBConnectionException()
        {
        }

        public OxDBConnectionException(string message)
            : base(message)
        {
        }

        public OxDBConnectionException(string reason, Exception e)
            : base(reason, e)
        {
        }
    }
}
