var pkg = require('./package.json');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-msbuild');

    var defaultTasks = [];
    defaultTasks.push('msbuild:oxygen');

    grunt.registerTask('default', defaultTasks);

    grunt.initConfig({
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
