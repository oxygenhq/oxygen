var decache = require('decache');

export default function moduleRequire(moduleName) {
    decache(moduleName);
    return require(moduleName);
}