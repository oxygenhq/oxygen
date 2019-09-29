/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
module.exports = function(grunt) {
    grunt.loadTasks('./tools/grunt-tasks');

    var defaultTasks = [];
    
    grunt.registerTask('default', defaultTasks);

    grunt.initConfig({
        dos2unix: {
            file: 'lib/cli.js'
        },
        unix2dos: {
            file: 'lib/cli.js'
        }
    });
};
