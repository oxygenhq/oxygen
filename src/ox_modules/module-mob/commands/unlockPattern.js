/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Unlocks a pattern lock
 * @function unlockPattern
 * @param {String|Element} locator - Element locator for the pattern lock.
 * @param {Number} cols - Number of columns in the pattern.
 * @param {Number} rows - Number of rows in the pattern.
 * @param {String} pattern - Pattern sequence. Pins are hexadecimal and case sensitive. See example.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>Pattern pins are treated similarly as the numbers of a phone dial. E.g. 3x4 pattern:</caption>
 * 1 2 3
 * 4 5 6
 * 7 8 9
 * a b c
 * @for android
 */
export async function unlockPattern(locator, cols, rows, pattern, timeout) {
    this.helpers.assertArgument(locator, 'locator');
    this.helpers.assertArgumentNumberNonNegative(cols, 'cols');
    this.helpers.assertArgumentNumberNonNegative(rows, 'rows');
    this.helpers.assertArgumentNonEmptyString(pattern, 'pattern');
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    await this.helpers.assertContext(this.helpers.contextList.android);

    var el = await this.helpers.getElement(locator, false, timeout);

    var loc = await el.getLocation();
    var locX = loc.x;
    var locY = loc.y;

    var cellSize = await el.getSize();
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

    await this.driver.touchAction(actions);
}
