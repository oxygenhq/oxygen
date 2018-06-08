/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * V8 debugger client.
 */

'use strict';

const { EventEmitter } = require('events');
const CDP = require('chrome-remote-interface');

class Debugger extends EventEmitter {
  constructor() {
    super();

    this._port = undefined;
    this._host = undefined;
    this._breakpoints = undefined;
    this._pendingBP = undefined;
    this.reset();
  }
  reset() {
    if (this._client) {
      this._client.close();
      this._client = null;
    }
    this._script = null;
    this._breakpoints = [];
    this._pendingBP = [];
  }
/**
 * Connects to a debugger. Does nothing if already connected.
 * @param {Integer} Debugger port.
 */
  async connect(port, host) {
    this._port = port;
    this._host = host || 'localhost';
    this._client = await CDP({ port: port });
    this._client.on('Debugger.scriptParsed', async (m) => await this._handleParsedScript(m));
    this._client.on('Debugger.paused', (e) => this.emit('break', e));
    const { Debugger, Runtime } = this._client;
    this._Debugger = Debugger;
    await Runtime.runIfWaitingForDebugger();
    await Debugger.enable();
    //this._script = await Debugger.scriptParsed();
    this.emit('ready');
  }
/**
 * Set breakpoint for a particular script.
 * @param {String} Script name.
 * @param {Integer} Debugger port.
 */
  async setBreakpoint(scriptPath, lineNumber) {
    let breakpoint = await this._Debugger.setBreakpointByUrl({
        url: scriptPath,
        lineNumber: lineNumber,
        columnNumber:0,
        condition: ''
    });
    if (breakpoint && breakpoint.locations && breakpoint.locations.length > 0) {
        this._breakpoints.push(breakpoint);
    }
    else {
        this.removeBreakpoint(breakpoint.breakpointId);
        this._pendingBP.push({ file: scriptPath, line: lineNumber});
    }
    return breakpoint;
  }

  async removeBreakpoint(breakpointId) {
    return await this._Debugger.removeBreakpoint({ breakpointId: breakpointId });
  }

  async continue() {
    await this._Debugger.paused();
    return await this._Debugger.resume();
  }

  async clearBreakpoints() {
    const self = this;
    if (this._breakpoints) {
        for (let b of this._breakpoints) {
            await self.removeBreakpoint(b.breakpointId);
        }
    }
  }

  async getScriptSource(scriptId) {
      return await this._Debugger.getScriptSource({ scriptId: scriptId });
  }

  async close() {
    if (this._client) {
        await this._client.close();
        this._client = null;
    }
    this.reset();
  }

  async _handleParsedScript(script) {      
      const url = script.url;
      let queueSize = this._pendingBP.length;
      let bp = null;
      for (let i=0; i< queueSize; i++) {
          bp = this._pendingBP.pop();
          if (bp.file === url) {
              await this.setBreakpoint(bp.file, bp.line);
          }
      }
  }
}

module.exports = Debugger;
