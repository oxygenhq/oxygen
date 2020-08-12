/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * @function getAppiumLogs
 * @summary Collects logs from the Appium server.
 * @return {Object[]} A list of logs.
 */
module.exports = async  function() {
    return await this.driver.getLogs('server');
};
