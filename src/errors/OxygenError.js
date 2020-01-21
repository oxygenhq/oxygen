/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
/*
 * Oxygen Error class
 */
import StackTrace from 'stack-trace';

const STACKTRACE_FILTERS = ['\\node_modules\\', '/node_modules/', '/oxygen-node/', '\\oxygen-node\\', '(module.js', '(internal/module.js', 'at <anonymous>', 'internal/', 'internal\\'];

export default class OxygenError extends Error {
    constructor(type, message, data, isFatal, orgErr = null) {
        super(message || undefined);
        this.type = type || this.type || null;
        // subtype allows to specify more particular error for a general Oxygen error type
        // for example, specify TypeError as subtype for a general SCRIPT_ERROR Oxygen type
        if (orgErr && typeof orgErr === 'string' && type !== orgErr) {
            this.subtype = orgErr;
        }
        else if (orgErr && typeof orgErr === 'object' && orgErr.type) {
            this.subtype = orgErr.type;
        }
        this.message = message || null;
        this.data = data || null;
        this.screenshot = null;
        this.isFatal = (typeof isFatal === 'undefined') ? true : isFatal;
        if (orgErr && orgErr.stack) {
            this.stack = orgErr.stack;
        }

        // don't generate stacktrace if OxygenError is used indirectly through inheritance
        if (type || message) {
            this.captureStackTrace();
            this.filterStackTrace();
            this.generateLocation();
        }
    }
    
    filterStackTrace() {
        if (!this.stack) {
            this.captureStackTrace();
        }
        this.stack = this.stack.split('\n').filter(this._stackTraceFilterFn).join('\n');
    }

    _stackTraceFilterFn(value) {
        return !STACKTRACE_FILTERS.some(filter => value.includes(filter));
    }

    generateLocation() {
        const stackTrace = StackTrace.parse(this) || [];
        if (stackTrace.length > 0) {
            const call = stackTrace[0];
            // add extra line if we are running in debugger mode (V8 debugger adds an extra line at the beginning of the file)
            //const extraLine = oxutil.isInDebugMode() ? 1 : 0;
            this.location = `${this.patchFilePathOnWindows(call.getFileName())}:${call.getLineNumber()}:${call.getColumnNumber()}`;
            this.stacktrace = stackTrace.map(call => `${this.patchFilePathOnWindows(call.getFileName())}:${call.getLineNumber()}:${call.getColumnNumber()}`);
        }
        else {
            this.location = null;
        }
    }

    patchFilePathOnWindows(filePath) {
        if (filePath && process.platform === 'win32' && typeof(filePath) === 'string' && filePath.length > 0) {
            return filePath.replace(/\//g, '\\');
        }
        return filePath;
    }

    captureStackTrace() {
        if (this.stack) {
            return;
        }
        else {
            try {
                //var orig = Error.prepareStackTrace;
                //Error.prepareStackTrace = function (_, stack) { return stack; };
                var err = new Error();
                Error.captureStackTrace(err, OxygenError);
                this.stack = err.stack;
                //Error.prepareStackTrace = orig;
            }
            catch (e) {
                console.error(e.message);
            }
        }
    }
}
