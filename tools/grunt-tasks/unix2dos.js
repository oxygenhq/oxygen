var os = require('os');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('unix2dos', 'Converts all occurrences of LF to CRLF in a file.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('unix2dos');
            var file = grunt.config.get('unix2dos').file;
            try {
                var data = fs.readFileSync(file, 'utf8');
                var data = data.replace(/\n/g, '\r\n');
                fs.writeFileSync(file, data, 'utf8');
            } catch (e) {
                grunt.fail.fatal(e);
            }
        }
    });
};
