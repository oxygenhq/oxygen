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
                path.replaceWith(t.awaitExpression(t.cloneNode(path.node)));
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
    const result = babel.transformSync(code, {
        filename,
        sourceType: 'script',
        parserOpts: {
            // top-level return is valid in CommonJS module context and inside our async IIFE wrapper
            allowReturnOutsideFunction: true,
        },
        plugins: [[createAsyncTransformPlugin(), { wrapInIIFE }]],
        sourceMaps: 'inline',
        configFile: false,
        babelrc: false,
    });
    return result.code;
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
