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
                string statusData = null;
                var status = GetStatusByException(e, out statusData);
                result = result.ErrorBase(status, statusData);
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
                string statusData = null;
                var status = GetStatusByException(e, out statusData);
                result = result.ErrorBase(status, statusData);
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

        private CheckResultStatus GetStatusByException(Exception e, out string moreInfo)
        {
            var type = e.GetType();
            moreInfo = null;

            if (type == typeof(OxDBConnectionException))
            {
                moreInfo = e.Message;
                return CheckResultStatus.DB_CONNECTION;
            }
            else if (type == typeof(OdbcException)) 
            {
                moreInfo = e.Message;
                return CheckResultStatus.DB_QUERY;
            }
            else
            {
                moreInfo = e.Message;
                return CheckResultStatus.UNKNOWN_ERROR;
            }
        }
	}
}
