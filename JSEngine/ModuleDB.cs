using System;
using System.Data.Odbc;

namespace CloudBeat.Selenium.JSEngine
{
    public class ModuleDB
	{
        private string connString;

        public delegate void ExceptionEventHandler(Exception e, string cmd, CheckResultStatus status);
        public event ExceptionEventHandler CommandException;

        public delegate void ExecutingEventHandler();
        public event ExecutingEventHandler CommandExecuting;

        public ModuleDB()
        {
        }

        [JSVisible]
        public void init(string connString)
        {
            if (CommandExecuting != null)
                CommandExecuting();
            this.connString = connString;
        }

        [JSVisible]
        public object getScalar(string query)
        {
            var cmdFormatted = string.Format("getScalar(\"{0}\")", query);
            if (CommandExecuting != null)
                CommandExecuting();

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
                    CommandException(e, cmdFormatted, CheckResultStatus.DB);
                else
                    throw e;
            }
            return null;
        }

        [JSVisible]
        public void executeNonQuery(string query)
        {
            var cmdFormatted = string.Format("executeNonQuery(\"{0}\")", query);
            if (CommandExecuting != null)
                CommandExecuting();

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
                    CommandException(e, cmdFormatted, CheckResultStatus.DB);
                else
                    throw e;
            }
        }

        private OdbcConnection Connect(string cmd)
        {
            try
            {
                OdbcConnection conn = new OdbcConnection(connString);
                conn.Open();
                return conn;
            }
            catch (Exception e)
            {
                if (CommandException != null)
                    CommandException(e, cmd, CheckResultStatus.DB);
                else
                    throw e;
            }
            return null;
        }
	}
}
