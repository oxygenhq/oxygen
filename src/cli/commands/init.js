/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * `oxygen init` - scaffold a project using the layout documented in the
 * oxygen-project-setup skill, so a generated project and a hand-written one agree.
 */

import fs from 'fs';
import path from 'path';

const FILES = {
    'oxygen.conf.js': `module.exports = {
    name: '{{name}}',

    capabilities: {
        browserName: 'chrome',
    },

    // download and launch chromedriver automatically - no Selenium grid needed
    autoStartWebDriver: true,

    iterations: 1,

    reporting: {
        reporters: ['html'],
        outputDir: './reports',
    },

    // only these modules are loaded; omit to load all of them
    modules: ['web', 'utils', 'log', 'assert'],

    hooks: {
        // beforeTest: () => {},
        // beforeCase: () => {},
        // afterCase:  () => {},
        // afterTest:  () => {},
    },
};
`,

    'oxygen.env.js': `module.exports = {
    default: {
        baseUrl: 'http://localhost:3000',
    },
    staging: {
        baseUrl: 'https://staging.example.com',
    },
};
`,

    'oxygen.po.js': `/*
 * Page object repository. Everything exported here is reachable in tests as \`po\`.
 * Keep locators here and behaviour in lib/ - see the oxygen-writing-tests skill.
 */
module.exports = {
    example: require('./po/examplePage'),
};
`,

    'po/examplePage.js': `module.exports = {
    heading: 'css=h1',
};
`,

    'cases/example.js': `web.transaction('1. Open the application');
web.init();
web.open('\${baseUrl}');

web.transaction('2. Confirm the page loaded');
web.waitForVisible(po.example.heading);
`,

    'suites/smoke.json': `{
    "name": "smoke",
    "iterations": 1,
    "cases": [
        { "name": "example", "path": "cases/example.js" }
    ]
}
`,

    '.gitignore': `node_modules/
reports/
`,
};

export default async function init(argv) {
    const dir = path.resolve(argv._[1] || argv.cwd || process.cwd());
    const name = argv.name || path.basename(dir);

    const existing = Object.keys(FILES).filter((rel) => fs.existsSync(path.join(dir, rel)));
    if (existing.length && !argv.force) {
        console.error(`Refusing to overwrite existing files in ${dir}:`);
        for (const rel of existing) {
            console.error(`  ${rel}`);
        }
        console.error('\nPass --force to overwrite them.');
        return 1;
    }

    for (const [rel, template] of Object.entries(FILES)) {
        const target = path.join(dir, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, template.replace(/\{\{name\}\}/g, name));
    }
    // created empty - a scaffolded data file would only be deleted
    fs.mkdirSync(path.join(dir, 'data'), { recursive: true });

    console.log(`Created Oxygen project "${name}" in ${dir}`);
    console.log(Object.keys(FILES).map((rel) => `  ${rel}`).join('\n'));
    console.log('\nNext:\n  oxygen .                     run the smoke suite');
    console.log('  oxygen session start URL     open a browser and walk through it by hand');
    return 0;
}
