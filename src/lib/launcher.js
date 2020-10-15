/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import _ from 'lodash';
import * as Runners from '../runners';
import queue from 'async/queue';

export default class Launcher {
    constructor(config, reporter) {
        this._config = config;
        this.reporter = reporter;
        this._results = [];
        this._queue = null;
    }

    async run(capsSet) {
        this._queue = queue((task, cb) => this._launchTest(task, cb), this._config.parallel || this._config.concurrency || 1);
        this._queue.error((err, task) => {
            console.log('Error in queue:', err);
        });

        // if no capabilities are specified, run single instance with default arguments
        if (!capsSet) {
            this._queue.push(null);
        }
        else {
            // make sure capsSet is an array 
            capsSet = Array.isArray(capsSet) ? capsSet : [capsSet];
            const _this = this;
            // the caps array might be empty in case of non-UI tests
            if (capsSet.length > 0) {
                _.each(capsSet, function(caps) {
                    _this._queue.push(caps);
                });
            }
            // handle non-UI tests by running the test with an empty caps object
            else {
                _this._queue.push({});
            }
            
        }
        await this._queue.drain();
    }

    /*********************************
     * Private methods
     *********************************/
    _instantiateRunner(caps) {
        if (this._config.framework && typeof this._config.framework === 'string') {
            if (Object.prototype.hasOwnProperty.call(Runners, this._config.framework)) {
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
            const result = await runner.run();
            this._results.push(result);
            await runner.dispose(result.status || null);
            callback();
        }
        catch (e) {
            console.error('Failed to launch the test:', e);
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
