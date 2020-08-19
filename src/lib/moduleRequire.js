var decache = require('decache');

export default function moduleRequire(moduleName) {
    try {
        decache(moduleName);
        return require(moduleName);
    } catch (e) {
        console.log('moduleRequire e', e);
        throw e;
    }
}