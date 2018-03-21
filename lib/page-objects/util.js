const oxutil = require('../util');
const Oxygen = require('../oxygen');

var self = module.exports = {
    getPageObjectRepository: function(filePath, requireBaseFolder, poCache, context, modules) {
        if (!filePath) {
            return [];
        }
        // check if the file has been already loaded
        if (poCache.hasOwnProperty(filePath)) {
            return poCache[filePath];
        }
        // create a new repository if not in cache
        var po = {};
        try {
            var fullPath = oxutil.resolvePath(filePath, requireBaseFolder);
            const poConfig = require(fullPath);
            var typeResolvePath = poConfig.config && poConfig.config.typesPath ? poConfig.config.typesPath : '.';
            // check if any element has been defined
            if (!poConfig.elements || typeof poConfig.elements !== 'object') {
                return {};
            }
            typeResolvePath = oxutil.resolvePath(typeResolvePath, requireBaseFolder);
            Object.keys(poConfig.elements).forEach(elmName => {
                const elm = poConfig.elements[elmName];
                po[elmName] = self.generatePageObject(elm, poConfig.config.defaultType, typeResolvePath, context, modules);
            });
            return po;
        }
        catch (e) {
            console.error(e);
        }
        return [];
    },
    generatePageObject: function(elm, defaultType, typeResolvePath, ctx, modules) {
        if (!elm) {
            return null;
        }
        var po = null;
        if (!elm.type && !defaultType) {
            po = elm.locators || null;
        }
        else {
            const typeName = elm.type || defaultType;
            var Type = null;
            // check if internal Oxygen type was specified
            if (typeName === "WebElement" || typeName === "MobileElement") {
                Type = Oxygen.po[typeName];
            }
            else {
                Type = self.requireOxygenBasedClass(oxutil.resolvePath(typeName, typeResolvePath));
            }
            po = new Type(ctx, modules, elm.locators);
        }
        // handle child objects, if defined
        if (elm.elements) {
            Object.keys(elm.elements).forEach(childElmName => {
                const childElm = elm.elements[childElmName];
                po[childElmName] = self.generatePageObject(childElm, defaultType, typeResolvePath, ctx, modules);
            });
        }
        return po;
    },
    requireOxygenBasedClass: function(classPath) {
        var BuiltinModule = require('module');
        // Guard against poorly mocked module constructors
        var Module = module.constructor.length > 1
        ? module.constructor
        : BuiltinModule;
        
        var orgLoad = Module._load;
        Module._load = function (request, parent, isMain) {
            if (request === 'oxygen') {
                return Oxygen;
            }
            else {
                return orgLoad.call(this, request, parent, isMain);
            }
        };
        var type = require(classPath);
        Module._load = orgLoad;
        return type;
    }
}