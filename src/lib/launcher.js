/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import _ from 'lodash';
import Runners from '../runners';
import { defer } from 'when';
import queue from 'async/queue';

export default class Launcher { 
    constructor(config, reporter) {
        this._config = config;
        this.reporter = reporter;
        this._results = [];
        this._queue = null;
    }

    async run(capabilitiesSets) {
        this._queue = queue((task, cb) => this._launchTest(task, cb), this._config.parallel || 1);
        this._queue.error((err, task) => {
            console.log('Error in queue:', err);
        });

        // if no capabilities are specified, run single instance with default arguments
        if (!capabilitiesSets) {
            this._queue.push(null);
        }
        else {
            const _this = this;
            _.each(capabilitiesSets, function(caps) {
                _this._queue.push(caps);
            });
        }
        await this._queue.drain();
    }

    /*********************************
     * Private methods
     *********************************/
    _instantiateRunner(caps) {
        if (this._config.framework && typeof this._config.framework === 'string') {
            if (Runners.hasOwnProperty(this._config.framework)) {
                return new Runners[this._config.framework]();
            }
            return null;
        }
        return new Runners.oxygen();
    }

    async _launchTest(caps, callback) {
        if (!callback) {
            return;
        }
        const runner = this._instantiateRunner(caps);
        if (!runner) {
            const framework = this._config.framework;
            callback(new Error(`Cannot find runner for the specified framework: ${framework}.`));
            return;
        }
        try {
            // initialize oxygen
            await runner.init(this._config, caps, this.reporter);   
            // run Oxygen test 
            const results = await runner.run();
            this._results.push(results);
            await runner.dispose();
            callback();
        }
        catch (e) {
            // stop processing the queue
            this._queue.kill();
            // if this is custom error message
            if (e.error) {
                var errMsg = '';
                var err = e.error;
                if (err.type)
                    errMsg += err.type + ' - ';
                if (err.message)
                    errMsg += err.message;
                else
                    errMsg = err.toString();
                callback(new Error(errMsg));
            }
            else {
                callback(e);    // call back with the original exception
            }
        }
    }
}
