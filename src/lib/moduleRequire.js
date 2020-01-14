var decache = require('decache');
var fs = require('fs');

function requireFromString(src, filename) {
    try {
        var Module = module.constructor;
        var m = new Module();
        m._compile(src, filename);
        return m.exports;
    } catch(e){
        console.log('requireFromString e', e);
    }
}

function orgRequire(path){
    try {
        var text = fs.readFileSync(path,'utf8');
        return requireFromString(text, path);
    } catch(e){
        console.log('orgRequire e', e);
    }
}

export default function moduleRequire(moduleName){
    try {
        decache(moduleName);
        var result = orgRequire(moduleName);
        return result;
    } catch(e){
        console.log('moduleRequire e', e);
    }
}