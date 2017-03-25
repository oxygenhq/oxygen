var fs = require('fs');
var path = require('path');
var doctrine = require('doctrine');
var modPath = path.resolve(__dirname, '../../ox_modules');

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

var DESC_MAIN = '<div class="desc-module">{0}</div>';

var INDEX_HEADER = '<h3 class="methods">Methods</h3>';
var INDEX = '<div class="index">' +
            '<div id="index-col-1" class="index-col">{0}</div>' +
            '<div id="index-col-2" class="index-col">{1}</div>' +
            '<div id="index-col-3" class="index-col">{2}</div>' +
            '</div>';
            
var SIGNATURE = '<h4 id="{0}">' +
                '<span class="signature">{0}({1})</span>' + 
                '<span class="signature-return">{2}</span>' +
                '</h4>';

var DESCRIPTION = '<div class="description">{0}</div>';

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

var RETURNS = '<h5>Returns:</h5>' +
                '<div class="param-desc"><span class="param-type">{0}</span> - {1}</div>';
  
var LINK = '<a href="#{0}">{0}</a><br />';

module.exports = function(grunt) {
    grunt.registerTask('apidoc', 'description', function() {
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
                            grunt.log.writeln('Generating ' + name + '.' + cmd.substring(0, cmd.length - '.js'.length));
                            modDoc.methods = modDoc.methods.concat(load(cmdfile, false).methods);
                        }
                    }
                    generate(modDoc, name);
                } else {
                    generate(load(path.join(modPath, m), true), name);
                    grunt.log.writeln('Generating ' + name);
                }
            } 
        }

        /*
         * Loads up JSDoc comments from a module-*.js file and stores them in a JSON (Doctrine) form.
         */
        function load(file, loadDescription) {
            try {
                var data = fs.readFileSync(file, 'utf8');
            
                var regex = /(\/\*\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/g;
                
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
                        for (var tag of this.tags)
                        {
                            if (tag.title === 'function') {
                                return tag.name;
                            }
                        }
                    };
                    commentParsed.getSummary = function() {
                        for (var tag of this.tags)
                        {
                            if (tag.title === 'summary') {
                                return tag.description.replace(/(\r\n|\n)/gm,'');
                            }
                        }
                    };
                    commentParsed.getDescription = function() {
                        for (var tag of this.tags)
                        {
                            if (tag.title === 'description') {
                                return tag.description.replace(/(\r\n|\n)/gm,''); 
                            }
                        }
                    };
                    commentParsed.getReturn = function() {
                        for (var tag of this.tags)
                        {
                            if (tag.title === 'return') {
                                return { 
                                    description: tag.description.replace(/(\r\n|\n)/gm,''), 
                                    type: tag.type.name 
                                };
                            }
                        }
                    };
                    commentParsed.getParams = function() {
                        var params = [];
                        for (var tag of this.tags)
                        {
                            if (tag.title === 'param') {
                                 
                                var type;
                                if (tag.type.type === 'OptionalType') {
                                    type = tag.type.expression.name;
                                } else {
                                    type = tag.type.name;
                                }
                                
                                params.push({ 
                                    description: tag.description.replace(/(\r\n|\n)/gm,''), 
                                    name: tag.name, 
                                    type: type 
                                });
                            }
                        }
                        return params;
                    };
                    
                    comments.push(commentParsed);
                }
                return { description: description.replace(/(\r\n|\n)/gm,''), methods: comments };
            } catch (exc) {       
                grunt.log.error("Unable to load/parse " + file, exc);
            }
        };

        function generate(module, moduleName) {
            var outFile = 'apidocs/api-' + moduleName + '.md';
            
            try {
                fs.unlinkSync(outFile);
            } catch (e) { }
            
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
                methodsUnsorted.push(method.getMethod());
            }
            
            var links1 = '';
            var links2 = '';
            var links3 = '';
            var i = 0;
            var colSize = methodsUnsorted.length/3;
            for (var method of methodsUnsorted.sort()) {   
                if (i < colSize) {
                    links1 += LINK.format(method);
                } else if (i >= colSize && i < colSize*2) {
                    links2 += LINK.format(method);
                } else {
                    links3 += LINK.format(method);
                }
                i++;
            }
            
            fs.appendFileSync(outFile, INDEX_HEADER);
            fs.appendFileSync(outFile, INDEX.format(links1, links2, links3));
            
            for (var method of module.methods) {
                var params = method.getParams();
                
                var paramConcat = [];
                for (var param of params) {           
                    paramConcat.push(param.name);
                }
                
                var ret = method.getReturn();
                
                // signature & description
                var sigHtml = SIGNATURE.format(method.getMethod(), 
                                                paramConcat.join(', '), 
                                                ret === undefined ? '' : '&rarr; {' + ret.type + '}');

                var methodDesc = method.getDescription();
                      
                var descHtml = DESCRIPTION.format(method.getSummary() + 
                                                  (methodDesc !== undefined ? 
                                                    '<br/><br/>' + methodDesc : ''));                              
                fs.appendFileSync(outFile, sigHtml + descHtml);
                
                // parameters
                if (paramConcat.length > 0) {
                    var paramRowsHtml = '';
                    
                    for (var param of params) {           
                        paramRowsHtml += PARAMS_ROW.format(param.name, param.type, param.description);
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
    });
};