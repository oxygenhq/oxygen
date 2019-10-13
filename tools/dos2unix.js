var os = require('os');
var fs = require('fs');

// Converts all occurrences of CRLF to LF in a file
if (os.platform() === 'win32') {
    try {
        var data = fs.readFileSync(process.argv[2], 'utf8');
        data = data.replace(/\r\n/g, '\n');
        fs.writeFileSync(process.argv[2], data, 'utf8');
    } catch (e) {
        console.error('Unable to dos2unix', e);
        process.exit(1);
    }
}
