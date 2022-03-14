/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import OxygenModule from '../core/OxygenModule';
import OxError from '../errors/OxygenError';
import errHelper from '../errors/helper';
import modUtils from './utils';

const MODULE_NAME = 'shell';

/**
 * @name shell
 * @description Provides methods for working with operating system shell.
 */
export default class ShellModule extends OxygenModule {
    constructor(options, context, rs, logger, modules, services) {
        super(options, context, rs, logger, modules, services);
        this._alwaysInitialized = true;
        // pre-initialize the module
        this._isInitialized = true;
        this._lastCmd;
        this._lastStdout;
    }

    /*
     * @summary Gets module name
     * @function name
     * @return {String} Constant value "shell".
     */
    get name() {
        return MODULE_NAME;
    }

    /**
     * @summary Execute command
     * @description Spawn child process
     * @function exec
     * @param {String} command - Shell command to be executed, including arguments, if applicable. 
     * @return {String} null | Error | stdout result
     */
    exec(command, options = {}) {
        this._lastCmd = command;
        this._lastStdout = null;
        const spawn = require('cross-spawn');
        options = { cwd: this.options.cwd, shell: true, env: process.env, ...options };
        const result = spawn.sync(command, options);
        if (result.error) {
            throw new OxError(errHelper.errorCode.SHELL_ERROR, result.error.message, null, true, result.error);
        }
        this._lastStdout = result.stdout ? result.stdout.toString() : null;
        if (result.stdout) {
            return result.stdout.toString();
        }
        return null;
    }

    /**
     * @summary Assert whether the shell command output (stdout) is matching the specified pattern.
     * @function assertOutput
     * @param {String} pattern - Pattern to assert.
     */
    assertOutput(pattern) {
        if (!this._lastStdout) {
            return false;
        }
        if (!modUtils.matchPattern(this._lastStdout, pattern)) {
            throw new OxError(errHelper.errorCode.ASSERT_ERROR, `Expected shell command output to match: "${pattern}" but got: "${this._lastStdout}"`);
        }
        return true;
    }
}