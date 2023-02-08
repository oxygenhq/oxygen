/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @summary Draw on a canvas element.
 * @function sign
 * @param {String|Element} locator - An element locator.
 * @param {Number=} timeout - Timeout in milliseconds. Default is 60 seconds.
 * @example <caption>[javascript] Usage example</caption>
 * web.init(); // Opens browser session.
 * web.open("www.yourwebsite.com"); // Opens a website.
 * web.sign("id=Canvas"); // Signs inside a canvas element.
 */

module.exports = async function(locator, timeout) {
    this.helpers.assertArgumentTimeout(timeout, 'timeout');
    var el = await this.helpers.getElement(locator, true, timeout);

    try {
        let random = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min
        }

        let ev = document.createEvent('MouseEvents')
        ev.initEvent('mousedown', true, true)
        el.dispatchEvent(ev)

        let ctx = el.getContext('2d')
        for (let i = 0; i < 30; i++) {
            ctx.lineTo(
                random(130, 300),
                random(30, 130)
            )
        }
        ctx.stroke()

        ev = document.createEvent('MouseEvents')
        ev.initEvent('mouseup', true, true)
        el.dispatchEvent(ev)
        
        ev = document.createEvent('MouseEvents')
        ev.initEvent('click', true, true)
        el.dispatchEvent(ev)
    } catch (e) {
        if (!el instanceof HTMLCanvasElement) {
            throw new this.OxError(`Element (${el}) must be of type Canvas`)
        }
        throw e;
    }
    await this.checkWaitForAngular();
};
