/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/**
 * @summary Unlocks a pattern lock
 * @function unlockPattern
 * @param {String} locator - Element locator for the pattern lock.
 * @param {Number} cols - Number of columns in the pattern.
 * @param {Number} rows - Number of rows in the pattern.
 * @param {String} pattern - Pattern sequence. Pins are hexadecimal and case sensitive. See example.
 * @example <caption>Pattern pins are treated similarly as the numbers of a phone dial. E.g. 3x4 pattern:</caption>
 * 1 2 3
 * 4 5 6
 * 7 8 9
 * a b c
 * @for android
 */
module.exports = function(locator, cols, rows, pattern) {
    this.helpers._assertArgument(locator, 'locator');
    this.helpers._assertArgumentNumberNonNegative(cols, 'cols');
    this.helpers._assertArgumentNumberNonNegative(rows, 'rows');
    this.helpers._assertArgumentNonEmptyString(pattern, 'pattern');

    if (this.autoWait) {
        this.waitForExist(locator);
    }

    var wdloc = this.helpers.getWdioLocator(locator);
    var el = this.driver.element(wdloc);
    if (!el.value) {
        throw new this.OxError(this.errHelper.errorCode.ELEMENT_NOT_FOUND);
    }

    var loc = this.driver.elementIdLocation(el.value.ELEMENT);
    var locX = loc.value.x;
    var locY = loc.value.y;

    var cellSize = this.driver.getElementSize(wdloc);
    var cellW = Math.round(cellSize.width / cols);
    var cellH = Math.round(cellSize.height / rows);

    var pinToCellIndexMap = {};
    var pinCounter = 1;
    var cellCoords = [];
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            // populate coordinates for each cell
            cellCoords.push({ x: locX + (cellW * c + cellW/2), y: locY + (cellH * r + cellH/2)});
            // create mapping between pattern "pins" (hexadecimal numbers) and indices in cellCoords
            pinToCellIndexMap[pinCounter.toString(16)] = pinCounter - 1;
            pinCounter++;
        }
    }

    var actions = [];

    // initial press for the first pin
    var cellIndex = pinToCellIndexMap[pattern[0]];
    var coord = cellCoords[cellIndex];
    var curCoordX = coord.x;
    var curCoordY = coord.y;
    actions.push({ action: 'press', x:  curCoordX, y: curCoordY});

    // moveTo actions for the rest of the pins
    for (var pin of pattern.substring(1)) {
        cellIndex = pinToCellIndexMap[pin];
        var nextCoord = cellCoords[cellIndex];

        var offsetX = Math.abs(curCoordX - nextCoord.x);
        var offsetY = Math.abs(curCoordY - nextCoord.y);
        offsetX = curCoordX < nextCoord.x ? offsetX : -offsetX;
        offsetY = curCoordY < nextCoord.y ? offsetY : -offsetY;

        curCoordX = nextCoord.x;
        curCoordY = nextCoord.y;

        actions.push({ action: 'moveTo', x: offsetX, y: offsetY });
    }

    // final release action
    actions.push('release');

    this.driver.touchAction(actions);
};
