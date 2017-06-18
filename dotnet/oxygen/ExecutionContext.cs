/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using System.Collections.Generic;

namespace CloudBeat.Oxygen
{
	public class ExecutionContext
	{
		public Dictionary<string, string> Parameters { get; set; }
		public Dictionary<string, string> Variables { get; set; }
		public Dictionary<string, string> Environment { get; set; }
	}
}
