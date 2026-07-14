const babel = require('@babel/core');
const fs = require('fs');
const Module = require('module');

function createAsyncTransformPlugin() {
    return ({ types: t }) => ({
        visitor: {
            FunctionDeclaration(path) {
                if (!path.node.async) path.node.async = true;
            },
            FunctionExpression(path) {
                if (!path.node.async) path.node.async = true;
            },
            ArrowFunctionExpression(path) {
                if (!path.node.async) path.node.async = true;
            },
            CallExpression(path) {
                if (path.parentPath.isAwaitExpression()) return;
                // don't await constructor arguments
                if (path.parentPath.isNewExpression()) return;
                const awaitExpr = t.awaitExpression(t.cloneNode(path.node));
                // copy source location so retainLines: true keeps it on the original line
                if (path.node.loc) {
                    awaitExpr.loc = path.node.loc;
                    awaitExpr.start = path.node.start;
                    awaitExpr.end = path.node.end;
                }
                path.replaceWith(awaitExpr);
            },
            Program: {
                exit(path, state) {
                    if (!state.opts.wrapInIIFE) return;
                    const body = [...path.node.body];
                    const asyncIIFE = t.callExpression(
                        t.arrowFunctionExpression([], t.blockStatement(body), true),
                        []
                    );
                    const exportStmt = t.expressionStatement(
                        t.assignmentExpression('=',
                            t.memberExpression(t.identifier('module'), t.identifier('exports')),
                            asyncIIFE
                        )
                    );
                    path.node.body = [exportStmt];
                }
            }
        }
    });
}

function transform(code, filename, wrapInIIFE = true) {
    try {
        const result = babel.transformSync(code, {
            filename,
            sourceType: 'script',
            parserOpts: {
                // top-level return is valid in CommonJS module context and inside our async IIFE wrapper
                allowReturnOutsideFunction: true,
            },
            plugins: [[createAsyncTransformPlugin(), { wrapInIIFE }]],
            sourceMaps: 'inline',
            retainLines: true,
            configFile: false,
            babelrc: false,
            // the code-frame babel embeds in parse SyntaxError.message is
            // colorized with ANSI escape codes by default (meant for a
            // terminal) — those end up as raw control characters in any
            // downstream consumer that isn't a terminal (e.g. a JSON
            // payload sent to a backend), so disable colorization here and
            // keep only the plain-text preview
            highlightCode: false,
        });
        return result.code;
    } catch (e) {
        // babel doesn't reliably set .filename on its own parse SyntaxError
        // across versions/configs — set it explicitly so error reporting
        // (OxygenError.generateLocation) can point at the actual user script
        // instead of falling back to a stack scan. That fallback can't find
        // this file anyway, since it was parsed from a string, not require()'d
        // as a module, so it never appears in any stack trace.
        if (e && !e.filename) {
            e.filename = filename;
        }
        throw e;
    }
}

let _originalJsExtension = null;
let _hookCwd = null;

function installRequireHook(cwd) {
    _hookCwd = cwd;
    _originalJsExtension = Module._extensions['.js'];
    Module._extensions['.js'] = _hookHandler;
}

function uninstallRequireHook() {
    if (_originalJsExtension) {
        Module._extensions['.js'] = _originalJsExtension;
        _originalJsExtension = null;
        _hookCwd = null;
    }
}

function _hookHandler(mod, filename) {
    if (_hookCwd && filename.startsWith(_hookCwd) && !filename.includes('node_modules')) {
        const code = fs.readFileSync(filename, 'utf8');
        // scripts that export an object/function keep their module.exports — only transform their internals
        const hasModuleExports = /\bmodule\.exports\s*=/.test(code);
        const transformed = transform(code, filename, !hasModuleExports);
        mod._compile(transformed, filename);
    } else {
        _originalJsExtension(mod, filename);
    }
}

module.exports = { transform, installRequireHook, uninstallRequireHook };
