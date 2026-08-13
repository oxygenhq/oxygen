import fs from 'fs';
import path from 'path';
const { randomUUID } = require('crypto');
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
        id: randomUUID(),
        fileName,
        filePath,
        type: 'other',
    };
}

// writes arbitrary data straight to the .cb-attachments folder (see lib/util.js's
// getAttachmentPath) and returns a small {id, type, fileName, filePath, subtype} reference
// instead of holding the data itself in memory — this is the same "reference a local file,
// let CloudBeat.Runner upload it generically" convention used for screenshots
// (OxygenCore.js's takeScreenshot/saveScreenshotToTempFile) and HAR (module-web.js's
// transaction HAR capture), so none of these potentially large payloads (page snapshots,
// HAR network captures) stay resident in memory for the rest of a long suite run.
// (Not to be confused with newFileAttachment() above, which references a file that already
// exists on disk instead of writing new data to one.)
export function newDataAttachment(options, data, fileExtension, type, subtype) {
    const attachmentId = randomUUID();
    const fileName = `${attachmentId}.${fileExtension}`;
    const attachmentFilePath = libUtil.getAttachmentPath(fileName, options);
    try {
        fs.writeFileSync(attachmentFilePath, data);
    }
    catch (e) {
        return undefined;
    }
    return {
        id: randomUUID(),
        type,
        fileName: fileName,
        filePath: attachmentFilePath,
        subtype,
    };
}

export function newSnapshotAttachment(options, snapshotData, snapshotType /* html, json, xml */) {
    return newDataAttachment(options, snapshotData, snapshotType || 'html', 'snapshot', snapshotType || 'html');
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
