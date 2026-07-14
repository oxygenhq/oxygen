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
import * as stackTraceParser from 'stacktrace-parser';
import fs from 'fs';
import path from 'path';

const STACKTRACE_FILTERS = ['\\node_modules\\', '/node_modules/', '/oxygen-node/', '\\oxygen-node\\', '(module.js', '(internal/module.js', 'at <anonymous>', 'internal/', 'internal\\'];

export default class OxygenError extends Error {
    constructor(type, message, data, isFatal, orgErr = null) {
        super(message || undefined);
        this.type = type || this.type || null;
        this.orgErr = orgErr;
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
        let anotherFile;
        let anotherLineNumber;
        let anotherColumn;

        // parse errors (e.g. a malformed user script caught by @babel/parser)
        // carry an exact location (.loc) and the file that was parsed
        // (.filename) directly on the error object — prefer this over
        // scanning the stack trace below, since that error's stack starts
        // inside @babel/parser's own internals (not the user's script),
        // which the stack-scanning fallback can otherwise mistake for the
        // error location.
        if (
            this.orgErr &&
            this.orgErr.loc &&
            typeof this.orgErr.loc.line === 'number' &&
            this.orgErr.filename &&
            fs.existsSync(this.orgErr.filename)
        ) {
            const column = typeof this.orgErr.loc.column === 'number' ? this.orgErr.loc.column : 0;
            this.location = `${this.patchFilePathOnWindows(this.orgErr.filename)}:${this.orgErr.loc.line}:${column}`;
            this.stacktrace = [this.location];
            return;
        }

        if (this.orgErr && this.orgErr.stack) {
            const anotherStack = stackTraceParser.parse(this.orgErr.stack);

            if (
                anotherStack &&
                Array.isArray(anotherStack) &&
                anotherStack.length > 0
            ) {
                for (let i = 0; i < anotherStack.length; i++) {

                    // skip frames inside node_modules (e.g. @babel/parser's own
                    // internals) — they're never the user's script, and taking
                    // the first "file exists on disk" frame without this check
                    // means we'd report the parser's own source location instead
                    if (
                        anotherStack[i]['file'] &&
                        !anotherStack[i]['file'].includes('node_modules') &&
                        fs.existsSync(anotherStack[i]['file']) &&
                        anotherStack[i]['lineNumber'] &&
                        !anotherFile &&
                        !anotherLineNumber
                    ) {

                        let file = anotherStack[i];

                        /*
                            Case: 
                            {
                                file: '*.js',
                                methodName: '<unknown>',
                                arguments: [],
                                lineNumber: 1,
                                column: null
                            },
                            {
                                file: '*.js',
                                methodName: 'Object.<anonymous>',
                                arguments: [],
                                lineNumber: 11,
                                column: 10
                            }
                        */
                        if (
                            anotherStack[i] &&
                            anotherStack[1+i] &&
                            anotherStack[i]['file'] === anotherStack[1+i]['file']
                        ) {
                            file = anotherStack[1+i];
                        }

                        anotherFile = file['file'];
                        anotherLineNumber = file['lineNumber'];
                        anotherColumn = file['column'] || 1;
                    }
                }
            }
        }

        let stackTrace = StackTrace.parse(this) || [];
        stackTrace = stackTrace.filter((item) => {
            const exist = fs.existsSync(item.fileName);
            return exist;
        });
        // Prefer the first frame from outside the oxygen installation (i.e. the user's test script)
        // __dirname is build/errors → 3 levels up reaches the project root (covers both src/ and build/)
        // Determine the oxygen root: __dirname is build/errors, so ../../ reaches the project root.
        // Add path.sep to avoid false matches on directories with similar prefix names.
        const oxRoot = path.normalize(path.join(__dirname, '../..')) + path.sep;
        const userFrame = stackTrace.find(item => {
            const fileName = item.getFileName();
            if (!fileName) return false;
            const normalized = path.normalize(fileName);
            return !normalized.startsWith(oxRoot) && !normalized.includes('node_modules');
        });
        if (stackTrace.length > 0) {
            const call = userFrame || stackTrace[0];
            if (call && call.fileName === 'vm.js' && this.orgErr && this.orgErr.stack) {
                let location = this.orgErr.stack.split('\n')[0];

                const locationSplit = location.split(':');

                if (locationSplit && locationSplit[0]) {

                    if (parseInt(locationSplit[locationSplit.length-1]) && parseInt(locationSplit[locationSplit.length-2])) {
                        // line and column present
                    } else if (parseInt(locationSplit[locationSplit.length-1])) {
                        // line present
                        location += ':0';
                    } else {
                        // only name present
                        location += ':0:0';
                    }
                }

                this.location = location;
                this.stacktrace = [
                    location,
                    ...stackTrace.map(call => `${this.patchFilePathOnWindows(call.getFileName())}:${call.getLineNumber()}:${call.getColumnNumber()}`)
                ];
            } else if (anotherFile && anotherLineNumber && anotherColumn) {
                this.location = `${this.patchFilePathOnWindows(anotherFile)}:${anotherLineNumber}:${anotherColumn}`;
                this.stacktrace = [this.location];
            } else {
                // add extra line if we are running in debugger mode (V8 debugger adds an extra line at the beginning of the file)
                //const extraLine = oxutil.isInDebugMode() ? 1 : 0;
                this.location = `${this.patchFilePathOnWindows(call.getFileName())}:${call.getLineNumber()}:${call.getColumnNumber()}`;
                this.stacktrace = stackTrace.map(call => `${this.patchFilePathOnWindows(call.getFileName())}:${call.getLineNumber()}:${call.getColumnNumber()}`);
            }
        } else if (anotherFile && anotherLineNumber && anotherColumn) {
            this.location = `${this.patchFilePathOnWindows(anotherFile)}:${anotherLineNumber}:${anotherColumn}`;
            this.stacktrace = [this.location];
        } else {
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
