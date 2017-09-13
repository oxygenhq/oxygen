var os = require('os');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('dos2unix', 'Converts all occurrences of CRLF to LF in a file.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('dos2unix');
            var file = grunt.config.get('dos2unix').file;
            try {
                var data = fs.readFileSync(file, 'utf8');
                var data = data.replace(/\r\n/g, '\n');
                fs.writeFileSync(file, data, 'utf8');
            } catch (e) {
                grunt.fail.fatal(e);
            }
        }
    });
};
