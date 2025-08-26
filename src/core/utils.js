import fs from 'fs';
import path from 'path';
const { v1 } = require('uuid');
const libUtil = require('../lib/util');

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

export function newFileAttachment(filePath) {
    const fileName = path.basename(filePath);
    return {
        id: v1(),
        fileName,
        filePath,
        type: 'other',
    };
}

export function newSnapshotAttachment(options, snapshotData, snapshotType /* html, json, xml */) {
    const attachmentId = v1();
    const fileExtension = snapshotType || 'html';
    const fileName = `${attachmentId}.${fileExtension}`;
    const attachmentFilePath = libUtil.getAttachmentPath(fileName, options);
    try {
        fs.writeFileSync(attachmentFilePath, snapshotData);
    }
    catch (e) {
        return undefined;
    }
    return {
        id: v1(),
        type: 'snapshot',
        fileName: fileName,
        filePath: attachmentFilePath,
        subtype: snapshotType || 'html',
    };
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
