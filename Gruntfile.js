/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-eslint');
    
    grunt.loadTasks('./tools/grunt-tasks');

    var defaultTasks = [];
    defaultTasks.push('eslint');
    
    grunt.registerTask('default', defaultTasks);

    grunt.initConfig({
        eslint: {
            target: ['Gruntfile.js', 'lib/**/*.js', 'errors/**/*.js', 'model/**/*.js', 'ox_modules/**/*.js'],
            options: {
                configFile: 'tools/.eslintrc.json'
            },
        },
        dos2unix: {
            file: 'lib/cli.js'
        },
        unix2dos: {
            file: 'lib/cli.js'
        }
    });
};
