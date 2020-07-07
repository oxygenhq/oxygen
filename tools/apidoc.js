var fs = require('fs');
var path = require('path');
var doctrine = require('doctrine');
import {MdReverse, TablePlugin, StrikethroughPlugin} from 'md-reverse/src/lib/mdReverse';
var modPath = path.resolve(__dirname, '../src/ox_modules');

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

var SIGNATURE_HEAD = '<div style="position:relative;">' +
                '</br>' +
                '<h2>' +
                '<span class="signature">{0}</span>' +
                '</h2>' +
                '</div>';

const img = (name) => ` ![](../../.gitbook/assets/${name}.png) `;
var SIGNATURE_AND = img('android');
var SIGNATURE_IOS = img('apple');
var SIGNATURE_HYB = img('hybrid');
var SIGNATURE_WEB = img('web');
var SIGNATURE_CHROME = '<div class="chrome" title="Chrome"></div>';
var SIGNATURE_FIREFOX = '<div class="firefox" title="Firefox"></div>';
var SIGNATURE_IE = '<div class="ie" title="Internet Explorer"></div>';

var DESCRIPTION = '<div class="description" markdown="1">&nbsp;{0}</div>';

var DEPRECATED = '<div class="deprecated">{0}</div>';

var PARAMS = '<br></br> **Parameters:** <br></br>' +
             '<table class="params">' +
             '<thead>'+
             '<tr>' +
             '<th>Name</th>' +
             '<th>Type</th>' +
             '<th class="last">Description</th>' +
             '</tr>' +
             '</thead>' +
             '<tbody>{0}</tbody>' +
             '</table>';

var PARAMS_ROW = '<tr>' +
                 '<td class="name"><code>{0}</code></td>' +
                 '<td class="type">{1}</td>' +
                 '<td class="description last">{2}</td>' +
                 '</tr>';

var OPTIONAL = '<code>optional</code> ';

var RETURNS = '<br></br> **Returns:** <br></br>' +
                '<div class="param-desc"><code>{0}</code> - {1}</div>';

var EXAMPLE = '<br></br> **{0}:** <br></br>' +
              '\n ```{1} \n' +
              '{2}'+
              '\n ``` </br>';

var modules = fs.readdirSync(modPath);
for (var m of modules) {
    if (!m.startsWith('module-')) {
        continue;
    }

    var name = m.substring('module-'.length, m.length - '.js'.length);

    if (fs.lstatSync(path.join(modPath, m)).isFile() && m.endsWith('.js')) {
        var modDir = path.join(modPath, 'module-' + name);

        if (fs.existsSync(modDir)) {
            let modDoc = load(path.join(modPath, m), true);
            // load commands
            var cmdsDir = path.join(modDir, 'commands');
            var cmds = fs.readdirSync(cmdsDir);
            for (var cmd of cmds) {
                var cmdfile = path.join(cmdsDir, cmd);
                if (fs.lstatSync(cmdfile).isFile() && cmd.endsWith('.js')) {
                    console.log('Generating ' + name + '.' + cmd.substring(0, cmd.length - '.js'.length));
                    modDoc.methods = modDoc.methods.concat(load(cmdfile, false).methods);
                }
            }
            sort(modDoc.methods);
            generate(modDoc, name);
        } else {
            let modDoc = load(path.join(modPath, m), true);
            sort(modDoc.methods);
            console.log('Generating ' + name);
            generate(modDoc, name);
        }
    }
}

/*
 * Sort commands alphabeticaly in place
 */
function sort(methods) {
    methods.sort((a, b) => {
        let aName;
        for (let tag of a.tags) {
            if (tag.title === 'function') {
                aName = tag.name;
                break;
            }
        }
        let bName;
        for (let tag of b.tags) {
            if (tag.title === 'function') {
                bName = tag.name;
                break;
            }
        }

        if (aName < bName) {
            return -1;
        }
        if (aName > bName) {
            return 1;
        }
        return 0;
    });
}

/*
 * Loads up JSDoc comments from a module-*.js file and stores them in a JSON (Doctrine) form.
 */
function load(file, loadDescription) {
    try {
        var data = fs.readFileSync(file, 'utf8');

        var regex = /(\/\*\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)/g;

        var commentRaw;
        var comments = [];
        var commentParsed;
        var description;
        var name = '';
        var note = '';
        var sample = '';

        if (loadDescription) {
            commentRaw = regex.exec(data);
            commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });

            // console.log('commentParsed', commentParsed);

            if (commentParsed && commentParsed.tags && Array.isArray(commentParsed.tags)) {
                for (var tag of commentParsed.tags) {
                    if (tag.title === 'name') {
                        name = tag.name;
                    } else if (tag.title === 'description') {
                        description = tag.description;
                    } else if (tag.title === 'note') {
                        note = tag.description;
                    } else if (tag.title === 'sample') {
                        sample = tag.description;
                    }

                }
            } else {
                description = commentParsed.description;
            }
        } else {
            description = '';
        }

        while ((commentRaw = regex.exec(data)) !== null) {
            commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });

            commentParsed.getMethod = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'function') {
                        return tag.name;
                    }
                }
            };
            commentParsed.getSummary = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'summary') {
                        return tag.description.replace(/(\r\n|\n)/gm,'');
                    }
                }
            };
            commentParsed.getDescription = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'description') {
                        return tag.description.replace(/(?<! {2})(\r\n|\n)/gm,'');
                    }
                }
            };
            // TODO: add support for multiple examples
            commentParsed.getExample = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'example') {
                        var example = {
                            description: tag.description,
                            caption: tag.caption
                        };
                        return example;
                    }
                }
            };
            commentParsed.getReturn = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'return') {
                        var type = doctrine.type.stringify(tag.type, {compact:true});
                        type = type.replace(/<|>/ig, function(m) {
                            return '&' + (m == '>' ? 'g' : 'l') + 't;';
                        });

                        return {
                            description: tag.description.replace(/(\r\n|\n)/gm,''),
                            type: type
                        };
                    }
                }
            };
            commentParsed.getParams = function() {
                var params = [];
                for (var tag of this.tags) {
                    if (tag.title === 'param') {
                        var optional;
                        if (tag.type.type === 'OptionalType' || tag.type.type === 'RestType') {
                            optional = true;
                        } else {
                            optional = false;
                        }

                        var type = doctrine.type.stringify(tag.type, {compact:true});
                        type = type.replace(/<|>/ig, function(m) {
                            return '&' + (m == '>' ? 'g' : 'l') + 't;';
                        });

                        if (optional && type) {
                            type = type.replace('=', '');
                        }

                        type = type.replace('(', '');
                        type = type.replace(')', '');

                        if (type && typeof type === 'string' && type.includes('|')) {
                            const typeArr = type.split('|');
                            const typeArrWithCode = typeArr.map((item) => { return '`'+item+'`'; });
                            type = typeArrWithCode.join('\\|');
                        } else {
                            type = '`'+type+'`';
                        }

                        params.push({
                            description: tag.description.replace(/(\r\n|\n)/gm,''),
                            name: tag.name,
                            type: type,
                            optional: optional
                        });
                    }
                }
                return params;
            };
            commentParsed.getFor = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'for') {
                        var fors = tag.description.replace(/(\r\n|\n)/gm,'').split(',').map(function(item) {
                            return item.trim();
                        });
                        return fors;
                    }
                }
            };
            commentParsed.getDeprecated = function() {
                for (var tag of this.tags) {
                    if (tag.title === 'deprecated') {
                        return 'This command is deprecated and will be removed in the future. ' + tag.description;
                    }
                }
            };

            comments.push(commentParsed);
        }
        return {
            description: description ? description.replace(/(?<! {2})(\r\n|\n)/gm, '') : '',
            name: name ? name.replace(/(?<! {2})(\r\n|\n)/gm, '') : '',
            note: note ? note.replace(/(?<! {2})(\r\n|\n)/gm, '') : '',
            sample: sample ? sample : '',
            methods: comments
        };
    } catch (exc) {
        console.error('Unable to load/parse ' + file, exc);
        process.exit(1);
    }
}

function generate(module, moduleName) {
    var outFile = 'apidocs/module-' + moduleName + '.md';
    var outContent = '';
    try {
        fs.unlinkSync(outFile);
    } catch (e) {
        // ignored
    }

    for (let method of module.methods) {
        var params = method.getParams();

        var paramConcat = [];
        for (let param of params) {
            paramConcat.push(param.name);
        }

        var ret = method.getReturn();

        var platforms = method.getFor();

        var platformSignature = '';
        if (platforms) {
            platforms.forEach(function(item) {
                switch (item) {
                    case 'android':
                        platformSignature += SIGNATURE_AND; break;
                    case 'ios':
                        platformSignature += SIGNATURE_IOS; break;
                    case 'hybrid':
                        platformSignature += SIGNATURE_HYB; break;
                    case 'web':
                        platformSignature += SIGNATURE_WEB; break;
                    case 'firefox':
                        platformSignature += SIGNATURE_FIREFOX; break;
                    case 'ie':
                        platformSignature += SIGNATURE_IE; break;
                    case 'chrome':
                        platformSignature += SIGNATURE_CHROME; break;
                    default:
                        console.error(`Unknown value '${item}' in @for attribute.`);
                        process.exit(1);
                }
            });
        }
        // signature & description
        var sigHtmlHead = SIGNATURE_HEAD.format(method.getMethod());

        var sigHtml = '';

        var methodDesc = method.getDescription();

        var descHtml = DESCRIPTION.format(method.getSummary() +
                                          (methodDesc !== undefined ? '<br></br>' + methodDesc : ''));

        var depricated = method.getDeprecated();
        var deprecatedHtml = depricated !== undefined ? DEPRECATED.format(method.getDeprecated()) : '';

        outContent += sigHtmlHead + sigHtml + deprecatedHtml + descHtml;

        // example
        var example = method.getExample();
        if (example !== undefined) {
            var caption = '';
            var language = '';

            var langStart = example.caption.indexOf('[');
            var langEnd = example.caption.indexOf(']');
            if (langStart !== -1 && langEnd !== -1) {
                caption = example.caption.substring(langEnd + 1);
                language = example.caption.substring(langStart + 1, langEnd);
            }
            var exampleHtml = EXAMPLE.format(caption, language, example.description);
            outContent += exampleHtml;
        }

        // parameters
        if (paramConcat.length > 0) {
            var paramRowsHtml = '';

            for (let param of params) {
                paramRowsHtml += PARAMS_ROW.format(param.name,
                                                    param.type,
                                                    (param.optional ? OPTIONAL : '') + param.description);
            }

            outContent += PARAMS.format(paramRowsHtml);
        }

        // returns
        if (ret !== undefined) {
            outContent += RETURNS.format(ret.type, ret.description);
        }

        // Supported On:
        if (platformSignature) {
            outContent += ` <br></br> **Supported On**: ${platformSignature}`;
        }
    }

    var mdReserve = new MdReverse();
    mdReserve.use(TablePlugin);
    mdReserve.use(StrikethroughPlugin);
    var content = mdReserve.toMarkdown(outContent);
    var startCntent = '';
    if (module.description) {
        startCntent += `---
description: ${module.description}
---`;
    }
    if (module.name) {
        startCntent += `
# ${module.name}  `;
    }
    if (module.note) {
        startCntent += `
{% hint style="warning" %}
${module.note}
{% endhint %}  `;
    }
    if (module.sample) {
        startCntent += `
${module.sample}  
`;
    }

    fs.appendFileSync(outFile, startCntent+content);
}
