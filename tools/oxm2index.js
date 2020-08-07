const fs = require('fs');
const path = require('path');
const modPath = path.resolve(__dirname, '..', 'src', 'ox_modules');

const modules = fs.readdirSync(modPath);
var modFilesIndexTxt = '';
for (var m of modules) {
    if (!m.startsWith('module-')) {
        continue;
    }

    const name = m.substring('module-'.length, m.length - '.js'.length);
    const fileName = path.parse(m).name;

    if (fs.lstatSync(path.join(modPath, m)).isFile() && m.endsWith('.js')) {
        modFilesIndexTxt += `import _${name} from './${fileName}';\n`;
        modFilesIndexTxt += `export const ${name} = _${name};\n`;
        modFilesIndexTxt += '\n';

        const modDir = path.join(modPath, 'module-' + name);

        if (fs.existsSync(modDir)) {
            // load commands
            var cmdsDir = path.join(modDir, 'commands');
            var cmds = fs.readdirSync(cmdsDir);
            var modCmdFilesIndexTxt = '';
            for (var cmd of cmds) {
                const cmdName = path.parse(cmd).name;
                modCmdFilesIndexTxt += `import _${cmdName} from './${cmdName}';\n`;
                modCmdFilesIndexTxt += `export const ${cmdName} = _${cmdName};\n`;
                modCmdFilesIndexTxt += '\n';
            }
            writeIndexFile(cmdsDir, modCmdFilesIndexTxt);
        }
    }
}

if (modFilesIndexTxt.length > 0) {
    writeIndexFile(modPath, modFilesIndexTxt);
}

function writeIndexFile(targetDir, content) {
    const outFile = path.join(targetDir, 'index.js');
    if (fs.existsSync(outFile)) {
        fs.unlinkSync(outFile);
    }
    fs.writeFileSync(outFile, content);
}
