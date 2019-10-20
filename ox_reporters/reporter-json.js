/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Oxygen JSON Reporter
 */
import path from 'path';
import fs from 'fs';

import FileReporterBase from '../lib/reporter/FileReporterBase';

export default class JSONReporter extends FileReporterBase {
    constructor(options) {
        super(options)
    }

    generate(results) {
        const resultFilePath = this.createFolderStructureAndFilePath('.json');
        const resultFolderPath = path.dirname(resultFilePath);

        this.replaceScreenshotsWithFiles(results, resultFolderPath);
        fs.writeFileSync(resultFilePath, JSON.stringify(results, null, 4));

        return resultFilePath;
    }
}

