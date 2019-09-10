/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Provides access to Applitools Eyes service.
 */
import OxygenModule from '../lib/core/OxygenModule';

export default class ApplitoolsModule extends OxygenModule {
    constructor(options, context, rs, logger, services) {
        super(options, context, rs, logger, services);
        // this module doesn't require calling init() method
        this.isInitialized = true;
    }
    /**
     * @summary Preform visual validation for a certain target.
     * @function check
     * @param {string} name - A name to be associated with the match.
     * @param {Target} target - Target instance which describes whether we want a window/region/frame.
     * @return {boolean} A promise which is resolved when the validation is finished.
     */
    async check(name, target = null) {
        const eyesService = this.services['applitools'];
        return await eyesService.check(name, target);
    }

    /**
     * @summary Takes a snapshot of the application under test and matches it with
     * the expected output.
     * @param {string} [tag=] - An optional tag to be associated with the snapshot.
     * @param {number} [matchTimeout=-1] - The amount of time to retry matching (Milliseconds).
     * @return {boolean} A promise which is resolved when the validation is finished.
     */
    async checkWindow(name, matchTimeout) {
        const eyesService = this.services['applitools'];
        return await eyesService.checkWindow(name, matchTimeout);
    }
}
