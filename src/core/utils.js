import fs from 'fs';
import path from 'path';

export function loadModuleFromClass(moduleName, moduleClass, moduleLogger, oxModulesDirPath, args) {
    if (moduleClass.default) {
        moduleClass = moduleClass.default;
    }
    // check if module contains external "commands" folder and if so load all the commands
    const cmdDirPath = oxModulesDirPath ? path.join(oxModulesDirPath, 'module-' + moduleName, 'commands') : null;
    addCommandsToPrototype(cmdDirPath, moduleName, moduleClass);
    // create an instance of the module 
    const module = new moduleClass(args.opts, args.ctx, args.resultStore, moduleLogger, args.modules, args.services);
    if (!module.name) {
        module.name = moduleName;
    }
    // apply this for functions inside 'helpers' methods collection if found
    applyThisInHelpers(module);
    return module;
}

export function loadModulesFromFile(moduleName, moduleFileName, moduleLogger, oxModulesDirPath, args) {
    const moduleClass = require(path.join(oxModulesDirPath, moduleFileName));
    // check if module contains external "commands" folder and if so load all the commands
    const cmdDirPath = oxModulesDirPath ? path.join(oxModulesDirPath, 'module-' + moduleName, 'commands') : null;
    addCommandsToPrototype(cmdDirPath, moduleName, moduleClass);
    // create an instance of the module 
    const module = new moduleClass(args.opts, args.ctx, args.resultStore, moduleLogger, args.modules, args.services);
    if (!module.name) {
        module.name = moduleName;
    }
    // apply this for functions inside 'helpers' methods collection if found
    applyThisInHelpers(module);
    return module;
}

function applyThisInHelpers(module) {
    if (module.helpers || (module._this && module._this.helpers)) {
        const helpers = module.helpers || module._this.helpers;
        for (var funcName in helpers) {
            if (typeof helpers[funcName] === 'function') {
                helpers[funcName] = helpers[funcName].bind(module._this || module);
            }
        }
    }
}

function addCommandsToPrototype(cmdDirPath, moduleName, moduleClass) {
    if (cmdDirPath && fs.existsSync(cmdDirPath)) {
        try {
            const commands = require(cmdDirPath);
            for (const [cmdName, cmdFunc] of Object.entries(commands)) {
                moduleClass.prototype[cmdName] = cmdFunc;
            }
        } catch (e) {
            throw new Error(`Cannot load external commands for module "${moduleName}": ` + e.message);
        }
    }
}

export function setStepType(step, module, moduleName, methodName, args) {
    const WEBDRIVER_MODULES = ['web', 'mob', 'win'];
    if (WEBDRIVER_MODULES.includes(moduleName)) {
        step.type = 'webdriver';
    }
    else {
        step.type = null;
    }
}