var fs = require('fs');
var path = require('path');
const spawn = require('cross-spawn');

const TYPES = [
    {
        'name': 'WebModuleMethods',
        'dtsFileName': 'module-web-methods',
        'globalAlias': 'web',
        'src': 'ox_modules/module-web/commands/index.js'
    },
    {
        'name': 'MobModuleMethods',
        'dtsFileName': 'module-mob-methods',
        'globalAlias': 'mob',
        'src': 'ox_modules/module-mob/commands/index.js'
    },
    {
        'name': 'WinModuleMethods',
        'dtsFileName': 'module-win-methods',
        'globalAlias': 'win',
        'src': 'ox_modules/module-win/commands/index.js'
    },
    {
        'name': 'Modules',
        'dtsFileName': 'modules-methods',
        'globalAlias': 'modules',
        'src': 'ox_modules/index.js'
    },
];
const DTS_TEMP_DIR_NAME = 'types_tmp';
const TSC_PATH = '../node_modules/.bin/tsc';

for (let typeDef of TYPES) {
    const srcPath = path.resolve(path.join(__dirname, '..', 'src', typeDef.src));
    const typesOutDir = path.resolve(path.join(__dirname, DTS_TEMP_DIR_NAME, typeDef.name));
    const result = spawn.sync(path.resolve(path.join(__dirname, TSC_PATH)), [
        srcPath,
        '--allowJs',
        '--declaration',
        '--emitDeclarationOnly',
        '--skipLibCheck',
        '--outDir',
        typesOutDir,
    ], { cwd: path.resolve(path.join(__dirname, '..')) });
    if (result.status !== 0) {
        console.error(`Failed to generate types for ${srcPath}`, result.output[1].toString());
        //continue;
    }
    const dtsFiles = getListOfDtsFiles(typesOutDir);
    if (dtsFiles.length === 0) {
        continue;
    }
    // generate type definition file, combining all functions under a single generated interface
    const allFuncDefs = [];
    for (let dtsFile of dtsFiles) {
        const fullPath = path.join(typesOutDir, dtsFile);
        const content = fs.readFileSync(fullPath).toString();
        // keep only function definition
        const matches = content.match(/((.*?\n)*.*?export function.*?;)/gm);
        if (!matches || !matches.length) {
            continue;
        }
        // remove 'export ' from function definition line
        let functionDef = matches[0].replace(/(^\s*export\s*function\s*)/gm, '');
        // replace Promise<void> to void (Oxygen takes care of async functions via Fibers)
        functionDef = functionDef.replace(/(Promise<void>)/gm, 'void');
        // add tab character before each line
        functionDef = functionDef.replace(/(^)/gm, '\t');
        allFuncDefs.push(functionDef);
    }
    const targetDtsFilePath = path.resolve(path.join(__dirname, DTS_TEMP_DIR_NAME, `${typeDef.dtsFileName}.d.ts`));
    const dtsFileContent = `interface ${typeDef.name} {\n${allFuncDefs.join('\n\n')}\n}`;
    fs.writeFileSync(targetDtsFilePath, dtsFileContent);
}

function getListOfDtsFiles(dirPath) {
    const files = fs.readdirSync(dirPath);
    return files.filter(f => f.endsWith('.d.ts'));
}
