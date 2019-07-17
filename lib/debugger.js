/*
 * Copyright (C) 2015-2018 CloudBeat Limited
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
const CDP = require('ox-chrome-remote-interface');

class Debugger extends EventEmitter {
    constructor() {
        super();

        this._port = undefined;
        this._host = undefined;
        this._breakpoints = undefined;
        this._pendingBP = undefined;
        this._paused = false;
        this.reset();
    }
    reset() {
        if (this._client) {
            this._client.close();
            this._client = null;
            this._paused = false;
        }
        this._breakpoints = [];
    }
    /**
     * Connects to a debugger. Does nothing if already connected.
     * @param {Integer} Debugger port.
     */
    async connect(port, host) {
        this._port = port;
        this._host = host || 'localhost';
        this._client = await CDP({ port: port });
        //this._client.on('Debugger.scriptParsed', async (m) => await this._handleParsedScript(m));
        this._client.on('Debugger.paused', (e) => { this._paused = true; this.emit('break', e); });
        const { Debugger, Runtime } = this._client;
        this._Debugger = Debugger;
        Runtime.enable();
        Debugger.enable();
        Debugger.setPauseOnExceptions({ state: 'none' });
        Debugger.setAsyncCallStackDepth({ maxDepth: 32 });
        Debugger.setBlackboxPatterns({ patterns: [] });
        // only use 'await' for the last call, all previous call to Debugger or Runtime will stack otherwise
        await Runtime.runIfWaitingForDebugger();
        // await for the first breakpoint which is placed by the debugger automatically 
        await this._Debugger.paused();
        this.emit('ready');
    }
    /**
     * Set breakpoint for a particular script.
     * @param {String} Script path.
     * @param {Integer} Line number.
     */
    async setBreakpoint(scriptPath, lineNumber) {
        let breakpoint = await this._Debugger.setBreakpointByUrl({
            url: scriptPath,
            lineNumber: lineNumber,
            columnNumber: 0,
            condition: ''
        }).catch(e => {
            // ignore error when trying to set an laready existing breakpoint
            if (!e.response || e.response.message !== 'Breakpoint at specified location already exists.') {
                throw e;
            }
        });
        await this.setBreakpointsActive(true);
        this._breakpoints.push(breakpoint);
        return breakpoint;
    }

    async setBreakpointsActive(active) {
        return await this._Debugger.setBreakpointsActive({'active': active});
    }

    async removeBreakpoint(breakpointId) {
        return await this._Debugger.removeBreakpoint({ breakpointId: breakpointId });
    }

    async continue() {
        if (this._paused) {
            this._paused = false;
            return await this._Debugger.resume();
        }
    }

    async removeBreakpointByValue(filePath, line) {
        const self = this;

        if (this._breakpoints) {
            for (let b of this._breakpoints) {        
                try {
                    if(b && b.breakpointId){
                        const parts = b.breakpointId.split(':');
                        let fileName;
                        let lineNumber;
    
                        if (process.platform === 'win32') { // path may contain a Drive letter on win32
                            fileName = parts[parts.length-2] + ':' + parts[parts.length-1];
                            lineNumber = parseInt(parts[1]);
                        } else {         
                            fileName = parts[parts.length-1];
                            lineNumber = parseInt(parts[1]);
                        }
    
                        if(fileName === filePath && lineNumber === line){
                            await self.removeBreakpoint(b.breakpointId);
                        }
                    }
                } catch (e) {
                    console.error('Failed when work with breakpoint data:', e);
                    return null;
                }

            }
        }

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
    }
}

module.exports = Debugger;
