var fs = require('fs');
var path = require('path');
var doctrine = require('doctrine');
var modPath = path.resolve(__dirname, '../build/ox_modules');

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

var MD = '---\n' +
        'currentSect: api\n' +
        'currentMenu: api-{0}\n' +
        '---\n';

var DESC_MAIN = '<div class="desc-module" markdown="1">{0}</div>';

var INDEX_HEADER = '<h3 class="methods">Methods</h3>';
var INDEX = '<div class="index">' +
            '<div id="index-col-1" class="index-col">{0}</div>' +
            '<div id="index-col-2" class="index-col">{1}</div>' +
            '<div id="index-col-3" class="index-col">{2}</div>' +
            '</div>';
            
var SIGNATURE = '<div style="position:relative;">' +
                // trick to scroll slightly above the target anchor, because floating header will overlap it otherwise
                '<div id="{0}" style="position:absolute;top:-70px;" />' +
                '<h4>' +
                '<span class="signature">{0}({1})</span>' +
                '<span class="signature-return">{2}</span>' +
                '<div class="signature-for">{3}</div>' +
                '</h4>' +
                '</div>';
                
var SIGNATURE_AND = '<div class="android" title="Native Android applications"></div>';
var SIGNATURE_IOS = '<div class="apple" title="Native iOS applications"></div>';
var SIGNATURE_HYB = '<div class="hybrid" title="Hybrid applications on Android/iOS"></div>';
var SIGNATURE_WEB = '<div class="web" title="Web applications on Android/iOS"></div>';
var SIGNATURE_CHROME = '<div class="chrome" title="Chrome"></div>';
var SIGNATURE_FIREFOX = '<div class="firefox" title="Firefox"></div>';
var SIGNATURE_IE = '<div class="ie" title="Internet Explorer"></div>';

var DESCRIPTION = '<div class="description" markdown="1">{0}</div>';

var DEPRECATED = '<div class="deprecated">{0}</div><br/>';

var PARAMS = '<h5>Parameters:</h5>' +
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
                 '<td class="type"><span class="param-type">{1}</span></td>' +
                 '<td class="description last">{2}</td>' +
                 '</tr>';

var OPTIONAL = '<span class="optional">optional</span>';
                 
var RETURNS = '<h5>Returns:</h5>' +
                '<div class="param-desc"><span class="param-type">{0}</span> - {1}</div>';
  
var LINK = '<a href="#{0}" class={1}>{0}</a><br />';

var EXAMPLE = '<div markdown="1">' +
              '<br/><span class="example-caption">{0}</span>' +
              '\n```{1}\n' + 
              '{2}'+
              '\n```\n' +
              '</div>';


var modules = fs.readdirSync(modPath);
for (var m of modules) {
    if (!m.startsWith('module-')) {
        continue;
    }

    var name = m.substring('module-'.length, m.length - '.js'.length);

    if (fs.lstatSync(path.join(modPath, m)).isFile() && m.endsWith('.js')) {
        var modDir = path.join(modPath, 'module-' + name);
        
        if (fs.existsSync(modDir)) {
            var modDoc = load(path.join(modPath, m), true);
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
            generate(modDoc, name);
        } else {
            generate(load(path.join(modPath, m), true), name);
            console.log('Generating ' + name);
        }
    }
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
        
        if (loadDescription) {
            commentRaw = regex.exec(data);
            commentParsed = doctrine.parse(commentRaw[0], { unwrap: true });
            description = commentParsed.description;
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
                        type = type.replace(/<|>/ig, function(m){
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
                        type = type.replace(/<|>/ig, function(m){
                            return '&' + (m == '>' ? 'g' : 'l') + 't;';
                        });
                        
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
            description: description.replace(/(?<! {2})(\r\n|\n)/gm, ''),
            methods: comments
        };
    } catch (exc) {
        console.error('Unable to load/parse ' + file, exc);
        process.exit(1);
    }
}

function generate(module, moduleName) {
    var outFile = 'apidocs/api-' + moduleName + '.md';
    
    try {
        fs.unlinkSync(outFile);
    } catch (e) {
        // ignored
    }
    
    // YAML front matter
    fs.appendFileSync(outFile, MD.format(moduleName));
    
    // header
    fs.appendFileSync(outFile, '\n' + moduleName + '\n==\n');
    
    // main div wrapper
    fs.appendFileSync(outFile, '<div class="apidoc">');

    // description
    fs.appendFileSync(outFile, DESC_MAIN.format(module.description));
    
    // index links
    var methodsUnsorted = [];
    for (var method of module.methods) {
        methodsUnsorted.push(method);
    }
    
    var links1 = '';
    var links2 = '';
    var links3 = '';
    var i = 0;
    var colSize = methodsUnsorted.length/3;

    var methodsSorted = methodsUnsorted.sort(function(a, b) {
        if (a.getMethod() < b.getMethod()) {
            return -1;
        }
        if (a.getMethod() > b.getMethod()) {
            return 1;
        }
        return 0;
    });

    for (let method of methodsSorted) {
        if (i < colSize) {
            links1 += LINK.format(method.getMethod(), method.getDeprecated() === undefined ? '' : 'deprecated');
        } else if (i >= colSize && i < colSize*2) {
            links2 += LINK.format(method.getMethod(), method.getDeprecated() === undefined ? '' : 'deprecated');
        } else {
            links3 += LINK.format(method.getMethod(), method.getDeprecated() === undefined ? '' : 'deprecated');
        }
        i++;
    }
    
    fs.appendFileSync(outFile, INDEX_HEADER);
    fs.appendFileSync(outFile, INDEX.format(links1, links2, links3));
    
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
            platforms.forEach(function(item){
                switch(item) {
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
        var sigHtml = SIGNATURE.format(method.getMethod(), 
                                        paramConcat.join(', '), 
                                        ret === undefined ? '' : '&rarr; {' + ret.type + '}',
                                        platformSignature);

        var methodDesc = method.getDescription();
              
        var descHtml = DESCRIPTION.format(method.getSummary() + 
                                          (methodDesc !== undefined ? '<br/><br/>' + methodDesc : ''));

        var depricated = method.getDeprecated();
        var deprecatedHtml = depricated !== undefined ? DEPRECATED.format(method.getDeprecated()) : '';

        fs.appendFileSync(outFile, sigHtml + deprecatedHtml + descHtml);

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
            fs.appendFileSync(outFile, exampleHtml);
        }
        
        // parameters
        if (paramConcat.length > 0) {
            var paramRowsHtml = '';
            
            for (let param of params) {
                paramRowsHtml += PARAMS_ROW.format(param.name,
                                                    param.type,
                                                    (param.optional ? OPTIONAL : '') + param.description);
            }
                
            fs.appendFileSync(outFile, PARAMS.format(paramRowsHtml));
        }

        // returns
        if (ret !== undefined) {
            fs.appendFileSync(outFile, RETURNS.format(ret.type, ret.description));
        }
    }

    fs.appendFileSync(outFile, '</div>');
}
