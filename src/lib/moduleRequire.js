var decache = require('decache');
var fs = require('fs');

function requireFromString(src, filename) {
    var Module = module.constructor;
    var m = new Module();
    m._compile(src, filename);
    return m.exports;
}

function orgRequire(path) {
    var text = fs.readFileSync(path,'utf8');
    return requireFromString(text, path);
}

export default function moduleRequire(moduleName) {
    try {
        decache(moduleName);
        var result = orgRequire(moduleName);
        return result;
    } catch (e) {
        console.log('moduleRequire e', e);
        throw e;
    }
}