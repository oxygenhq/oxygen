module.exports = function (filePath, mode) {
	var module = {};
	var csvLoader = require('csv-load-sync');
	var table = csvLoader(filePath);
	
	if (!table || table.length == 0)
			throw new Error("Parameter table is not defined or empty");
	// initialize currentRow according with parameter reading mode (random or sequential)
	var currentRow = mode === 'random' ? random(0, table.length - 1) : 0;
	
	module.readNext = function () {
		if (mode === 'random')
			currentRow = random(0, table.length - 1);
		else
			currentRow++;
		if (currentRow > table.length - 1)
			currentRow = 0;
	};
	
	module.getValues = function() {
		if (!table || table.length == 0)
			throw new Error("Paramter table is not defined or empty");
		return table[currentRow];
	};
	
	function random(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
	
	return module;
}