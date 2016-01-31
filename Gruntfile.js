var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-msbuild');

    var defaultTasks = [];
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
                        dest: 'Oxygen' 
                    }
                ], 
                verbose: true
            },
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
