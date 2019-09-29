var os = require('os');
var fs = require('fs');

// Converts all occurrences of LF to CRLF in a file
if (os.platform() === 'win32') {
    try {
        var data = fs.readFileSync(process.argv[2], 'utf8');
        data = data.replace(/\n/g, '\r\n');
        fs.writeFileSync(process.argv[2], data, 'utf8');
    } catch (e) {
        console.error('Unable to unix2dos', e);
        process.exit(1);
    }
}
