using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CloudBeat.Oxygen.Parameters
{
	public interface IParameterManager
	{
		bool ContainsParameter(string name);
		string GetValue(string name);
		void ReadNextValues();
	}
}
