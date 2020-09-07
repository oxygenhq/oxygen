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

import logger from '../lib/logger';
const log = logger('Debugger');
const { EventEmitter } = require('events');
const CDP = require('ox-chrome-remote-interface');
import url from 'url';

const CONNECT_RETRIES = 4;
const CONNECT_SNOOZE_INTERVAL_MULT = 2;
const MAX_DEPTH = 5;
let maxFindedDepth = 0;

const transformToIDEStyle = (fileName) => {
    const uriIndex = fileName.indexOf('file:');
    const bpData = fileName.substring(0, uriIndex);
    let uri = fileName.substring(uriIndex);
    // fix UNC paths
    if (process.platform === 'win32' && uri.startsWith('file:///')) {
        uri = 'file://' + uri.substring('file:///'.length);
    }
    return bpData + url.fileURLToPath(uri);
};

// snooze function - async wrapper around setTimeout function
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const deleteValues = (arr, depth) => {

    if (depth > maxFindedDepth) {
        maxFindedDepth = depth;
    }

    if (depth > MAX_DEPTH) {
        return [];
    }

    let result = arr.map((item) => {
        if (item && item.value && item.value.className && item.value.className === 'Function') {
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

function extractBreakpointData(bpStr) {
    if (!bpStr || typeof bpStr !== 'string') {
        return null;
    }

    try {
        bpStr = transformToIDEStyle(bpStr);
        const parts = bpStr.split(':');

        const lineNumber = parseInt(parts[1]);

        // romove file number, line number, column number
        parts.splice(0, 3);

        // looks line need only for windows path whith disk, like C://
        // for windows network folders and mac not need
        const fileName = parts.join(':');

        return {
            fileName: fileName,
            lineNumber: lineNumber
        };

    } catch (e) {
        log.error(`Failed to extract breakpoint data: ${bpStr}`);
        return null;
    }
}

function validateBreakpoint(breakpoint) {
    const brObj = extractBreakpointData(breakpoint.breakpointId);

    const brLineNumber = brObj.lineNumber + 1; // from 0-base to 1 base;

    if (breakpoint && breakpoint.locations && Array.isArray(breakpoint.locations) && breakpoint.locations.length > 0) {
        let result = null;
        breakpoint.locations.map((item) => {
            const brFileName = brObj.fileName;
            const itemLineNumber = item.lineNumber + 1; // from 0-base to 1 base;

            if (brLineNumber !== itemLineNumber) {
                result = {
                    msg: `Breakpoints warning : ${brFileName} Don't have opportunity to have breakpoint at line : `,
                    fileName: brFileName,
                    line: brLineNumber
                };
            }
        });

        return result;
    } else {
        return null;
    }

}
export default class Debugger extends EventEmitter {
    constructor(pid) {
        super();

        this._pid = pid;
        this._port = undefined;
        this._host = undefined;
        this._breakpoints = undefined;
        this._pendingBP = undefined;
        this._paused = false;
        this._client = null;
        this._fileNameAliases = [];
        this._breakpointErrors = [];
        this.reset();
    }
    reset() {
        if (this._client) {
            this._client.close();
            this._client = null;
            this._paused = false;
        }
        this._breakpoints = [];
        this._fileNameAliases = [];
    }

    async getPropertiesByObjectId(objectId, depth, elm) {
        let data = {};

        try {
            data = await this._Runtime.getProperties({
                objectId : objectId
            });
        } catch (e) {
            // console.log('getProperties elm', elm);
            // console.log('getProperties e', e);
        }
        let clone = Object.assign({}, data);

        if (clone && clone && clone.result) {
            clone = Object.assign({}, clone, {
                result: deleteValues(clone.result, depth)
            });
        }

        return clone;
    }

    async getPromiceAllResult(mapResultFiltered) {
        let promiseAllPromise = await Promise.all(mapResultFiltered).then(value => {
            return value;
        });

        if (promiseAllPromise && Array.isArray(promiseAllPromise) && promiseAllPromise.length > 0) {
            promiseAllPromise = promiseAllPromise.filter((item) => !!item);
        }

        return promiseAllPromise;
    }

    async getProperties(objectId, depth, elm) {
        const promises = [];

        const getPropertiesResult = await this.getPropertiesByObjectId(objectId, depth, elm);

        if (getPropertiesResult) {
            if (getPropertiesResult && getPropertiesResult.result && Array.isArray(getPropertiesResult.result)) {

                const mapResult = getPropertiesResult.result.map(async (item) => {
                    if (item && item.value && item.value.objectId) {
                        const getPropertiesInnerResult = await this.getProperties(item.value.objectId, depth+1, item);

                        if (item.scopeItem) {
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

                if (mapResultFiltered && Array.isArray(mapResultFiltered) && mapResultFiltered.length > 0) {

                    const promiseAllPromise = await this.getPromiceAllResult(mapResultFiltered);

                    if (promiseAllPromise && Array.isArray(promiseAllPromise) && promiseAllPromise.length > 0) {
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

        if (promises.length > 0) {
            return Promise.all(promises).then(values => {
                return values;
            });

        } else {
            return false;
        }
    }

    async processScope(scopeChain, depth) {
        let scopeChainResult = await scopeChain.map(async (chain) => {
            if (chain && chain.object && chain.object.objectId) {
                if (typeof chain.object.objectId === 'string' && chain.type !== 'global') {
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
            if (Array.isArray(values)) {
                return values.filter((el) => !!el);
            } else {
                return values;
            }
        });
    }

    async processCallFrames(callFrames, depth) {
        let callFramesMapResult = await callFrames.map(async(callFrame) => {
            if (callFrame && callFrame.scopeChain && Array.isArray(callFrame.scopeChain)) {
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

    inBreakpoints(itemUrl) {
        let result = false;
        if (this._breakpoints && Array.isArray(this._breakpoints) && this._breakpoints.length > 0) {
            this._breakpoints.map((bp) => {
                if (
                    itemUrl &&
                    itemUrl.toLowerCase &&
                    bp.origin &&
                    bp.origin.scriptPath &&
                    bp.origin.scriptPath.toLowerCase &&
                    itemUrl.toLowerCase() === bp.origin.scriptPath.toLowerCase()
                ) {
                    result = true;
                }
            });
        }
        return result;
    }

    inFileNameAliases(fileName) {
        let result = false;
        if (this._fileNameAliases && Array.isArray(this._fileNameAliases) && this._fileNameAliases.length > 0) {
            this._fileNameAliases.map((alias) => {
                if (
                    alias &&
                    alias.toLowerCase &&
                    fileName &&
                    fileName.toLowerCase &&
                    alias.toLowerCase() === fileName.toLowerCase()
                ) {
                    result = alias;
                }
            });
        }
        return result;
    }

    async continueConnect() {

        this._client.on('Debugger.scriptParsed', async(m) => {
            if (m && m.url) {
                if (m.url.toLowerCase) {
                    const filelc = m.url.toLowerCase();
                    let breakpointForChange;
                    const findResult = this._breakpoints.find((item) => {
                        if (item.origin && item.origin.scriptPath && item.origin.scriptPath.toLowerCase) {
                            const breakpointlc = item.origin.scriptPath.toLowerCase();

                            if (breakpointlc === filelc && item.origin.scriptPath !== m.url) {

                                if (this._fileNameAliases.includes(m.url)) {
                                    // ignore
                                } else {
                                    this._fileNameAliases.push(m.url);
                                }

                                this._paused = true;
                                this._Debugger.pause();

                                breakpointForChange = {
                                    breakpoint: item,
                                    mUrl: m.url
                                };
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    });

                    if (findResult) {
                        const breakpointsFromOldLocation = [];

                        this._breakpoints.map((bp) => {
                            if (
                                bp &&
                                bp.origin &&
                                bp.origin.scriptPath &&
                                breakpointForChange &&
                                breakpointForChange.mUrl &&
                                breakpointForChange.breakpoint &&
                                breakpointForChange.breakpoint.origin &&
                                breakpointForChange.breakpoint.origin.scriptPath &&
                                bp.origin.scriptPath === breakpointForChange.breakpoint.origin.scriptPath
                            ) {
                                breakpointsFromOldLocation.push({
                                    scriptPath: breakpointForChange.mUrl,
                                    lineNumber: bp.origin.lineNumber
                                });
                            }
                        });

                        if (breakpointsFromOldLocation && Array.isArray(breakpointsFromOldLocation) && breakpointsFromOldLocation.length > 0) {
                            let breakpointsFromOldLocationResult = breakpointsFromOldLocation.map(async(bp) => {
                                return await this.setBreakpoint(bp.scriptPath, bp.lineNumber);
                            });

                            breakpointsFromOldLocationResult = breakpointsFromOldLocationResult.filter((el) => !!el);

                            Promise.all(breakpointsFromOldLocationResult).then(async(value) => {
                                await this._Debugger.resume();
                                this._paused = true;
                                await this._Debugger.pause();
                            });
                        }

                    }
                }
            }
        });

        this._client.on('Debugger.paused', (e) => {
            this._paused = true;
            if (e.reason === 'Break on start') {
                this._brokeOnStart = true;
            } else {
                // Chrome debugger doesn't seem to remove breakpoints when using removeBreakpoint
                // and 'something' is still getting hit. not clear why this is happening.
                // thus, we emit break event only if matching breakpoint still exists in this._breakpoints

                const possibleBreakpointsData = [];
                let eCallFrames = [];

                if (e && e.callFrames && Array.isArray(e.callFrames) && e.callFrames.length > 0) {
                    e.callFrames.map((item) => {
                        if (item && item.url && this.inBreakpoints(item.url)) {
                            eCallFrames.push(item);
                        }
                    });
                }

                let breakpointsMapResult = this._breakpoints.map(async(bp) => {
                    if (bp &&
                        bp.locations &&
                        eCallFrames &&
                        eCallFrames[0] &&
                        bp.locations.length > 0 &&
                        bp.locations[0].scriptId === eCallFrames[0].location.scriptId &&
                        bp.locations[0].lineNumber === eCallFrames[0].location.lineNumber) {

                        const initialDepth = 1;

                        if (e && e.callFrames && Array.isArray(e.callFrames) && e.callFrames.length > 0) {
                            const uniqueScriptIdArr = [];
                            const callFrames = e.callFrames.filter((item) => {
                                if (item && item.url) {
                                    const finded = this._breakpoints.find((breakpoint) => {
                                        let result = false;

                                        if (breakpoint.breakpointId.endsWith(item.url)) {
                                            result = true;
                                        }

                                        return result;
                                    });

                                    if (finded) {
                                        if (item.location && item.location.scriptId) {
                                            if (uniqueScriptIdArr.includes(item.location.scriptId)) {
                                                return false;
                                            } else {
                                                uniqueScriptIdArr.push(item.location.scriptId);
                                                return finded;
                                            }
                                        } else {
                                            return false;
                                        }
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return false;
                                }
                            });

                            try {
                                callFrames.map(async(item) => {
                                    let possibleBreakpoints = await this.getPossibleBreakpoints(item.location);
                                    const scriptSource = await this.getScriptSource(item.location.scriptId);

                                    const scriptSourceSplit = scriptSource.scriptSource.split('\n');

                                    let fileLineNumbersLength = 0;
                                    if (scriptSourceSplit && Array.isArray(scriptSourceSplit) && scriptSourceSplit.length > 0) {
                                        fileLineNumbersLength = scriptSourceSplit.length;
                                        // to see how debbuger see script

                                        // scriptSourceSplit.map((scriptSourceItem, idx) => {
                                        //     console.log((idx) + ' ' + scriptSourceItem);
                                        // });
                                    }

                                    possibleBreakpointsData.push({
                                        breakpoints: possibleBreakpoints,
                                        file: item.url,
                                        fileLineNumbersLength: fileLineNumbersLength
                                    });
                                });

                            } catch (e) {
                                console.log('getScriptSource e', e);
                            }

                            let callFramesMapResult = await this.processCallFrames(callFrames, initialDepth);

                            callFramesMapResult = callFramesMapResult.filter((el) => !!el);

                            return callFramesMapResult;
                        } else {
                            return null;
                        }

                    } else {
                        return null;
                    }
                });

                breakpointsMapResult = breakpointsMapResult.filter((el) => !!el);

                Promise.all(breakpointsMapResult).then(value => {
                    let saveValue = value;

                    if (saveValue && Array.isArray(saveValue)) {
                        saveValue = saveValue.filter((el) => !!el);
                    }

                    if (saveValue && Array.isArray(saveValue) && saveValue.length > 0) {
                        let breakpointData = null;

                        // assume we always send breakpoint of the top call frame
                        if (eCallFrames && eCallFrames.length > 0) {

                            breakpointData = {
                                lineNumber: eCallFrames[0].location.lineNumber,
                                fileName: transformToIDEStyle(eCallFrames[0].url)
                            };

                            if (saveValue) {
                                breakpointData.variables = saveValue;
                            }
                        }

                        if (
                            this._breakpointErrors &&
                            Array.isArray(this._breakpointErrors) &&
                            this._breakpointErrors.length > 0
                        ) {
                            const isset = this._breakpoints.find((item) => {
                                if (
                                    item &&
                                    item.origin &&
                                    item.origin.lineNumber &&
                                    parseInt(item.origin.lineNumber)+1 === parseInt(breakpointData.lineNumber)
                                ) {
                                    return item;
                                } else if (
                                    item &&
                                    item.locations &&
                                    Array.isArray(item.locations) &&
                                    item.locations.length > 0 &&
                                    item.locations.find(loc => {
                                        return parseInt(loc.lineNumber) === parseInt(breakpointData.lineNumber);
                                    }) &&
                                    parseInt(item.origin.lineNumber) !== 1 &&
                                    parseInt(breakpointData.lineNumber) !== 1
                                ) {
                                    return item;
                                } else {
                                    return false;
                                }
                            });

                            if (isset) {
                                let realBrfinded = false;
                                this._breakpointErrors.map((breakpointError) => {
                                    if (
                                        this._breakpoints &&
                                        Array.isArray(this._breakpoints) &&
                                        this._breakpoints.length > 0
                                    ) {
                                        this._breakpoints.map((br) => {
                                            const brFileName = transformToIDEStyle(br.origin.scriptPath);

                                            let possibleBreakpointData;
                                            if (
                                                possibleBreakpointsData &&
                                                Array.isArray(possibleBreakpointsData) &&
                                                possibleBreakpointsData.length > 0
                                            ) {
                                                possibleBreakpointData = possibleBreakpointsData.find((item) => item.file === eCallFrames[0].url);
                                            }

                                            if (
                                                brFileName === breakpointData.fileName &&
                                                (
                                                    breakpointData.lineNumber+1 === br.origin.lineNumber ||
                                                    br.origin.lineNumber+1 === possibleBreakpointData.fileLineNumbersLength
                                                )
                                            ) {
                                                realBrfinded = true;
                                            }
                                        });
                                    }
                                });

                                if (!realBrfinded) {
                                    breakpointData.resolved = true;
                                }
                            }
                        }

                        let possibleBreakpointData;

                        if (
                            possibleBreakpointsData &&
                            Array.isArray(possibleBreakpointsData) &&
                            possibleBreakpointsData.length > 0
                        ) {
                            possibleBreakpointData = possibleBreakpointsData.find((item) => item.file === eCallFrames[0].url);
                        }

                        if (
                            possibleBreakpointData &&
                            possibleBreakpointData.fileLineNumbersLength &&
                            breakpointData.lineNumber+1 >= possibleBreakpointData.fileLineNumbersLength
                        ) {
                            breakpointData.lineNumber = possibleBreakpointData.fileLineNumbersLength - 2;
                        }

                        this.emit('break', breakpointData);

                        if (
                            this._breakpointErrors &&
                            Array.isArray(this._breakpointErrors) &&
                            this._breakpointErrors.length > 0
                        ) {
                            this._breakpointErrors.map((breakpointError) => {
                                if (breakpointError && breakpointError.msg && breakpointError.fileName && breakpointError.line) {

                                    let msg;
                                    let ignore = false;

                                    if (possibleBreakpointsData && Array.isArray(possibleBreakpointsData) && possibleBreakpointsData.length > 0) {
                                        possibleBreakpointsData.map((item) => {

                                            item.file = transformToIDEStyle(item.file);

                                            if (item && item.file === breakpointError.fileName) {
                                                let line;

                                                if (breakpointError.line >= item.fileLineNumbersLength) {
                                                    line = breakpointError.line - 2; // //# sourceMappingURL and }.call(this, exports, require, module, __filename, __dirname); });
                                                } else {
                                                    line = breakpointError.line;
                                                }

                                                if (item.breakpoints && Array.isArray(item.breakpoints) && item.breakpoints.length > 0) {
                                                    if (breakpointError && breakpointError.msg && breakpointError.msg.includes('Possible breakpoint lines')) {
                                                        // ignore
                                                    } else {
                                                        if (item.breakpoints.includes(line)) {
                                                            ignore = true;
                                                        }

                                                        msg = breakpointError.msg;
                                                        msg += `${line}. `;
                                                        msg += ` Possible breakpoint lines : ${item.breakpoints.map((line) => line).join(', ')}`;
                                                    }
                                                } else {
                                                    if (breakpointError && breakpointError.msg && breakpointError.msg.includes('possible breakpoint lines')) {
                                                        // ignore
                                                    } else {
                                                        msg = breakpointError.msg;
                                                        msg += `${line}. `;
                                                        msg += ' File don\'t have possible breakpoint lines';
                                                    }
                                                }
                                            }
                                        });
                                    }

                                    if (!ignore) {
                                        this.emit('breakError', {
                                            message: msg,
                                            lineNumber: breakpointError.line,
                                            fileName: breakpointError.fileName
                                        });
                                    }
                                }
                            });
                        }
                    } else {
                        console.log('should continue');
                        if (e.reason === 'OOM') {
                            // Out of memory leak
                            this.continue();
                        }
                    }

                }, reason => {
                    // console.log('breakpointsMapResult res reason' , reason);
                });

            }
        });

        this._client.on('Debugger.breakpointResolved', (e) => {
            this.onBreakpointResolved(e);
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

    onBreakpointResolved(e) {
        // breakpoints set before the script was loaded will be resolved once it loads
        for (var bp of this._breakpoints) {
            if (
                bp &&
                e &&
                bp.breakpointId === e.breakpointId
            ) {

                let validateResult;
                if ( e.location ) {
                    // resolved on runtime
                    bp.locations = [e.location];
                    validateResult = validateBreakpoint(bp);
                } else if ( e.locations ) {
                    // resolved on pause
                    validateResult = validateBreakpoint(bp);
                }

                if (validateResult) {
                    this._breakpointErrors.push(validateResult);
                }
            }
        }
    }

    /**
     * Connects to a debugger. Does nothing if already connected.
     * @param {Integer} Debugger port.
     */
    async connect(port, host) {
        this._port = port;
        this._host = host || 'localhost';

        let snoozeTime = 1000;
        let lastError = null;

        for (let retries = 0; retries < CONNECT_RETRIES; retries++) {
            try {
                this._client = await CDP({ port: this._port, host: this._host });
                lastError = null;
                break;
            } catch (e) {
                lastError = e;
            }

            log.warn(`Debugger connection failed. Will retry in ${snoozeTime/1000}s. Error: `, lastError);
            await snooze(snoozeTime);
            snoozeTime *= CONNECT_SNOOZE_INTERVAL_MULT;
        }

        if (lastError) {
            log.error('Failed to connect to the debugger: ', lastError);
            throw lastError;
        }

        await this.continueConnect();
    }

    /**
     * Set breakpoint for a particular script.
     * @param {String} Script path.
     * @param {Integer} Line number.
     */
    async setBreakpoint(scriptPath, lineNumber) {
        let fileName = scriptPath;

        const aliasResult = this.inFileNameAliases(fileName);

        if (aliasResult) {
            fileName = aliasResult;
        }

        fileName = url.pathToFileURL(fileName).toString();
        let err = null;

        let breakpoint = await this._Debugger.setBreakpointByUrl({
            url: fileName,
            lineNumber: lineNumber-1, // from 1-base to 0-base
            columnNumber: 0
        }).catch(e => {
            err = e;
            // ignore error when trying to set an laready existing breakpoint
            if (!e.response || e.response.message !== 'Breakpoint at specified location already exists.') {
                throw e;
            }
        });
        if (err) {
            // ignore
        } else {
            breakpoint.origin = {
                scriptPath: fileName,
                lineNumber: lineNumber
            };

            this._breakpoints.push(breakpoint);

            if (breakpoint) {
                // new breackpoint resolved success
                this.onBreakpointResolved(breakpoint);
            }
        }

        return breakpoint;
    }

    async setBreakpointsActive(active) {
        if (this._Debugger && this._Debugger.setBreakpointsActive) {
            return await this._Debugger.setBreakpointsActive({'active': active});
        } else {
            await snooze(500);
            return await this.setBreakpointsActive(active);
        }
    }

    async removeBreakpoint(breakpointId) {
        this._breakpoints = this._breakpoints.filter((bp) => {
            return bp.breakpointId !== breakpointId;
        });

        const removeBr = { breakpointId: breakpointId };

        return await this._Debugger.removeBreakpoint(removeBr);
    }

    async continue() {
        if (this._paused) {
            this._paused = false;
            return await this._Debugger.resume();
        }
    }

    async resume() {
        if (this._paused) {
            this._paused = false;
            return await this._Debugger.resume();
        }
    }

    async resumeTerminate() {
        if (this._paused) {
            this._paused = false;
            await this._Debugger.resume(true);
        }
    }

    async removeBreakpointByValue(filePath, inputLine) {

        const filePathAlias = this.inFileNameAliases(filePath);

        const line = inputLine - 1; // from 1-base to 0-base
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

                        if (
                            (fileName === filePath || fileName === filePathAlias)
                            && lineNumber === line
                        ) {
                            await self.removeBreakpoint(b.breakpointId);
                        }
                    }
                } catch (e) {
                    log.error('Failed when work with breakpoint data:', e);
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

    async getPossibleBreakpoints(startLocation) {
        const result = [];
        const possibleBreakpoints = await this._Debugger.getPossibleBreakpoints({
            start: {
                scriptId: startLocation.scriptId,
                lineNumber: 0,
                columnNumber: 0
            }
        });

        if (possibleBreakpoints && possibleBreakpoints.locations && Array.isArray(possibleBreakpoints.locations) && possibleBreakpoints.locations.length > 0) {
            possibleBreakpoints.locations.map((item) => {
                if (item && typeof item.lineNumber !== 'undefined') {
                    const lineNumber = item.lineNumber + 1; // from 0-base to 1-base

                    if (result.includes(lineNumber)) {
                        //ignore
                    } else {
                        result.push(lineNumber);
                    }
                }
            });
        }

        if (result && Array.isArray(result) && result.length > 0) {
            let p = result.pop();

            if (result.includes(p-1)) {
                //ingore
            } else {
                if (p-1 > 1) {
                    result.push(p-1);
                }
            }
        }

        return result;
    }

    async getScriptSource(scriptId) {
        return await this._Debugger.getScriptSource({ scriptId: scriptId });
    }

    async close() {
        // console.log('debugger close');
        // try {
        //     if (this._client) {
        //         if(CDP){
        //             if(CDP.List){
        //                 CDP.List({ port: this._port, host: this._host }, (err, targets) => {
        //                     if(targets && Array.isArray(targets) && targets.length > 0){

        //                         this.closeDone = false;

        //                         targets.map((target) => {
        //                             const promise = CDP.Close({id: target.id}, (err) => {
        //                                 this.closeDone = true;
        //                             });

        //                             if(promise && promise.then){
        //                                 promise.then(() => {

        //                                 }, () => {

        //                                 });
        //                             }

        //                         });

        //                         deasync.loopWhile(() => !this.closeDone);

        //                     }
        //                 });
        //             }
        //         }
        //         this._client = null;
        //     }
        // } catch(e){
        //     console.log('debugger close e', e);
        // }
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
                lineNumber = parseInt(parts[1])+1; //from 0-base to 1-base
            } else {
                fileName = parts[parts.length-1];
                lineNumber = parseInt(parts[1])+1; //from 0-base to 1-base
            }

            if (fileName === filePath) {
                bps.push(lineNumber);
            } else {
                const filePathAlias = this.inFileNameAliases(filePath);
                if (filePathAlias) {
                    bps.push(lineNumber);
                }
            }
        }
        return bps;
    }
}
