/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Cucumber worker process.
 * Provides everything necessary for executing Cucumber-based JS test scripts.
 */
if(['darwin','win32'].includes(process.platform) && process.env.NODE_ENV === undefined){
    var fs = require('fs');
    var path = require('path');
    var envPreset = './../../../../@babel/preset-env';
    var envPath = path.resolve(__dirname,envPreset);

    if (fs.existsSync(envPath)) {
        // use preset env from parent node_modules
    } else {
        envPath = '@babel/preset-env';
    }

    require('@babel/register')({
        // Since babel ignores all files outside the cwd, it does not compile sibling packages
        // So rewrite the ignore list to only include node_modules
        ignore: [__dirname + '/../../../node_modules', /node_modules/, /app\/node_modules/],
        retainLines: true,
        overrides: [{
            'test': [/underscore.js/, /websocket.js/],
            'sourceType': 'script',
        },{
            'exclude': /app\/node_modules/
        },{
            'exclude': /node_modules/
        }],
        'presets': [[envPath, {
            'targets': { 'browsers': ['last 2 chrome versions'] }
        }]],
    });
    require('./worker');
} else {
    require('@babel/register')({
        // Since babel ignores all files outside the cwd, it does not compile sibling packages
        // So rewrite the ignore list to only include node_modules
        ignore: [__dirname + '/../../../node_modules', /node_modules/, /app\/node_modules/],
        retainLines: true,
        overrides: [{
            'test': [/underscore.js/, /websocket.js/],
            'sourceType': 'script',
        },{
            'exclude': /app\/node_modules/
        },{
            'exclude': /node_modules/
        }],
        'presets': [['@babel/preset-env', {
            'targets': { 'browsers': ['last 2 chrome versions'] }
        }]],
    });
    require('./worker');
}