var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-msbuild');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    var defaultTasks = [];
    defaultTasks.push('jshint');
    defaultTasks.push('msbuild:oxygen');
    defaultTasks.push('sync:main');
    
    grunt.registerTask('default', defaultTasks);

    grunt.initConfig({
        sync: {
            main: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'node_modules/oxygen/bin/Debug', src: ['**'], 
                        dest: 'dotnet' 
                    }
                ], 
                verbose: true
            },
        },
        jshint: {
            files: ['Gruntfile.js', 'lib/*.js', 'errors/*.js', 'model/*.js'],
                options: {
                    esnext: true,
                    curly: false,
                    loopfunc: true,
                    shadow: true
                }
        },
        msbuild: {
            oxygen: {
                src: ['node_modules/oxygen/Oxygen.csproj'],
                options: {
                    projectConfiguration: 'Debug',
                    targets: ['Rebuild'],
                    version: 12.0,
                    maxCpuCount: 4,
                    buildParameters: {
                        WarningLevel: 2
                    },
                    verbosity: 'minimal'
                }
            }
        }
    });
};
