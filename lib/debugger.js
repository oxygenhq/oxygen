/*
 * Copyright (C) 2015-present CloudBeat Limited
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
const MAX_DEPTH = 10;
let maxFindedDepth = 0;

const deleteValues = (arr, depth) => {

    if(depth > maxFindedDepth){
        maxFindedDepth = depth;
    }
    
    if(depth > MAX_DEPTH){
        return [];
    }

    let result = arr.map((item) => {
        if(item && item.value && item.value.className && item.value.className === 'Function'){
            const cloneValue = Object.assign(item.value);
            delete cloneValue.objectId;
            const clone = Object.assign(item, {
                value: cloneValue
            });
            delete clone.objectId;
            return clone;
        } else {
            return item;
        }
    });

    return result;
};

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

    async getPropertiesByObjectId(objectId, depth){

        const data = await this._Runtime.getProperties({
            objectId : objectId
        });

        let clone = Object.assign({}, data);
        
        if(clone && clone && clone.result){
            clone = Object.assign({}, clone, {
                result: deleteValues(clone.result, depth)
            });
        }

        return clone;
    }

    async getPromiceAllResult(mapResultFiltered){
        let promiseAllPromise = await Promise.all(mapResultFiltered).then(value => {
            return value;
        });

        if(promiseAllPromise && Array.isArray(promiseAllPromise) && promiseAllPromise.length > 0){
            promiseAllPromise = promiseAllPromise.filter((item) => !!item);
        }
        
        return promiseAllPromise;
    }

    async getProperties(objectId, depth){
        const promises = [];

        const getPropertiesResult = await this.getPropertiesByObjectId(objectId, depth);
            
        if(getPropertiesResult){
            if(getPropertiesResult && getPropertiesResult.result && Array.isArray(getPropertiesResult.result)){

                const mapResult = getPropertiesResult.result.map(async (item) => {
                    if(item && item.value && item.value.objectId){
                        const getPropertiesInnerResult = await this.getProperties(item.value.objectId, depth+1);

                        if(item.scopeItem){
                            return null;
                        } else {
                            return getPropertiesInnerResult;
                        }
                    }
                });

                const mapResultFiltered = mapResult.filter((item) => !!item);
                                
                const result = {
                    depth: depth,
                    objectId: objectId,
                    objectIdResponse: Object.assign({}, getPropertiesResult, {
                        objectId: objectId
                    })
                };

                if(mapResultFiltered && Array.isArray(mapResultFiltered) && mapResultFiltered.length > 0){

                    const promiseAllPromise = await this.getPromiceAllResult(mapResultFiltered);
                    
                    if(promiseAllPromise && Array.isArray(promiseAllPromise) && promiseAllPromise.length > 0){
                        result.child = promiseAllPromise;
                        return result;
                    } else {
                        return result;
                    }

                } else {
                    return result;
                }


            } else {
                return {
                    depth: depth,
                    objectId: objectId,
                    objectIdResponse: Object.assign({}, getPropertiesResult, {
                        objectId: objectId
                    })
                };
            }
        }

        if(promises.length > 0){
            return Promise.all(promises).then(values => {
                return values;
            });

        } else {
            return false;
        }
    }

    async processScope(scopeChain, depth){
        let scopeChainResult = await scopeChain.map(async (chain) => {
            if(chain && chain.object && chain.object.objectId){
                if(typeof chain.object.objectId === 'string' && chain.type !== 'global'){
                    if(!this.waitPropertiesResult){
                        this.waitPropertiesResult = true;
                    }
                    
                    const getPropertiesResult = await this.getProperties(chain.object.objectId, depth);
                    
                    return getPropertiesResult;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        });

        scopeChainResult = scopeChainResult.filter((el) => !!el);
        
        return Promise.all(scopeChainResult).then(values => {
            if(Array.isArray(values)){
                return values.filter((el) => !!el);
            } else {
                return values;
            }
        });
    }

    async processCallFrames(callFrames, depth){
        let callFramesMapResult = await callFrames.map(async(callFrame) => {
            if(callFrame && callFrame.scopeChain && Array.isArray(callFrame.scopeChain)){
                const processScopeResult = await this.processScope(callFrame.scopeChain, depth);
                return processScopeResult;
            } else {
                return null;
            }
        });

        callFramesMapResult = callFramesMapResult.filter((el) => !!el);

        return Promise.all(callFramesMapResult).then(values => {
            return values;
        });
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
        this._client.on('Debugger.paused', (e) => {
            
            this._paused = true;
            if (e.reason === 'Break on start') {
                this._brokeOnStart = true;
            } else {

                this.waitPropertiesResult = false;

                // Chrome debugger doesn't seem to remove breakpoints when using removeBreakpoint
                // and 'something' is still getting hit. not clear why this is happening.
                // thus, we emit break event only if matching breakpoint still exists in this._breakpoints

                // for (var bp of this._breakpoints) {
                let breakpointsMapResult = this._breakpoints.map(async(bp) => {
                    if (bp &&
                        bp.locations &&
                        e.callFrames &&
                        bp.locations.length > 0 &&
                        bp.locations[0].scriptId === e.callFrames[0].location.scriptId &&
                        bp.locations[0].lineNumber === e.callFrames[0].location.lineNumber) {

                        const initialDepth = 1;
                            
                        if(e && e.callFrames && Array.isArray(e.callFrames) && e.callFrames.length > 0){
                            let callFramesMapResult = await this.processCallFrames(e.callFrames, initialDepth);

                            callFramesMapResult = callFramesMapResult.filter((el) => !!el);
                                                        
                            return callFramesMapResult;
                        } else {
                            return null;
                        }
                        
                    }
                });

                breakpointsMapResult = breakpointsMapResult.filter((el) => !!el);

                
                Promise.all(breakpointsMapResult).then(value => {
                    let saveValue = value;

                    if(saveValue && Array.isArray(saveValue)){
                        saveValue = saveValue.filter((el) => !!el);
                    }

                    console.log('maxFindedDepth', maxFindedDepth);
                    this.emit('break', e, saveValue);

                }, reason => {
                    console.log('breakpointsMapResult res reason' , reason);
                }); 

                if(this.waitPropertiesResult){
                    // ignore
                } else {
                    this.continue();
                }
            }
        });

        this._client.on('Debugger.breakpointResolved', (e) => {
            // breakpoints set before the script was loaded will be resolved once it loads
            for (var bp of this._breakpoints) {
                if (bp && bp.breakpointId === e.breakpointId) {
                    bp.locations = [e.location];
                }
            }
        });
        const { Debugger, Runtime } = this._client;
        this._Debugger = Debugger;
        this._Runtime = Runtime;

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
            columnNumber: 0
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
        this._breakpoints = this._breakpoints.filter((bp) => {
            return bp.breakpointId !== breakpointId;
        });
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
                    if (b && b.breakpointId) {
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
    
                        if (fileName === filePath && lineNumber === line) {
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

    getBreakpoints(filePath) {
        var bps = [];
        for (let b of this._breakpoints) {
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

            if (fileName === filePath) {
                bps.push(lineNumber);
            }
        }
        return bps;
    }

    async _handleParsedScript(script) {
    }
}

module.exports = Debugger;
