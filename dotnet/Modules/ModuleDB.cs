using System;
using System.Data.Odbc;

namespace CloudBeat.Oxygen.Modules
{
	public class ModuleDB : IModule
	{
        private string connString;

        public delegate void ExceptionEventHandler(Exception e, string cmd, DateTime startTime, CheckResultStatus status);
        public event ExceptionEventHandler CommandException;

		ExecutionContext ctx;
		bool isInitialized = false;

		#region Argument Names
		const string ARG_CONN_STR = "db@connString";
		#endregion

        public ModuleDB()
        {
        }

        
        public void init(string connString)
        {
            this.connString = connString;
        }

        public object getScalar(string query)
        {
			DateTime cmdStartTime = DateTime.UtcNow;

            var cmdFormatted = string.Format("getScalar(\"{0}\")", query);

            try
            {
                var conn = Connect(cmdFormatted);
                OdbcCommand cmd = new OdbcCommand(query, conn);
                var result = cmd.ExecuteScalar();
                conn.Close();
                return result;
            }
            catch (Exception e)
            {
                if (CommandException != null)
					CommandException(e, cmdFormatted, cmdStartTime, CheckResultStatus.DB);
                else
                    throw e;
            }
            return null;
        }

        public void executeNonQuery(string query)
        {
			DateTime cmdStartTime = DateTime.UtcNow;

            var cmdFormatted = string.Format("executeNonQuery(\"{0}\")", query);

            try
            {
                var conn = Connect(cmdFormatted);
                OdbcCommand cmd = new OdbcCommand(query, conn);
                var result = cmd.ExecuteNonQuery();
                conn.Close();
            }
            catch (Exception e)
            {
                if (CommandException != null)
                    CommandException(e, cmdFormatted, cmdStartTime, CheckResultStatus.DB);
                else
                    throw e;
            }
        }

        private OdbcConnection Connect(string cmd)
        {
			DateTime cmdStartTime = DateTime.UtcNow;

            try
            {
                OdbcConnection conn = new OdbcConnection(connString);
                conn.Open();
                return conn;
            }
            catch (Exception e)
            {
                if (CommandException != null)
					CommandException(e, cmd, cmdStartTime, CheckResultStatus.DB);
                else
                    throw e;
            }
            return null;
        }

		public bool Initialize(System.Collections.Generic.Dictionary<string, string> args, ExecutionContext ctx)
		{
			this.ctx = ctx;

			if (args.ContainsKey(ARG_CONN_STR))
				connString = args[ARG_CONN_STR];

			isInitialized = true;

			return true;
		}

		public bool Dispose()
		{
			return true;
		}

		public bool IsInitialized
		{
			get { return isInitialized; }
		}

		public object IterationStarted()
		{
			return null;
		}

		public object IterationEnded()
		{
			return null;
		}

		public string Name
		{
			get { return "DB"; }
		}
	}
}
