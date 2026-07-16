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
            CallExpression(path, state) {
                if (path.parentPath.isAwaitExpression()) return;
                // don't await constructor arguments
                if (path.parentPath.isNewExpression()) return;
                // files that keep their own module.exports (page objects / support
                // files, wrapInIIFE === false) never get their top level wrapped in
                // an async IIFE (see Program.exit below) — awaiting a call sitting
                // directly at that top level (e.g. a top-level `require(...)`) would
                // introduce genuine top-level await, turning the compiled file into
                // an ES module and breaking any later synchronous require() of it
                // (ERR_REQUIRE_ASYNC_MODULE). Calls inside nested functions are
                // unaffected — those functions are themselves made async below, so
                // awaiting calls inside them is safe.
                if (!state.opts.wrapInIIFE && !path.getFunctionParent()) {
                    return;
                }
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
        // scripts that export an object/function keep their module.exports — only transform their internals.
        // Matches both whole-object assignment (`module.exports = {...}`) and
        // per-property assignment (`module.exports.foo = ...` / `exports.foo = ...`,
        // a common pattern in page-object/support files) — requiring only the
        // exact `module.exports =` form previously missed the per-property style,
        // causing the whole file to be wrapped in an async IIFE whose Promise
        // return value overwrote every property assigned inside it, so requiring
        // the file back gave an object full of `undefined`s.
        const hasModuleExports = /\bmodule\.exports\b|\bexports\s*\.\s*\w+\s*=/.test(code);
        const transformed = transform(code, filename, !hasModuleExports);
        mod._compile(transformed, filename);
    } else {
        _originalJsExtension(mod, filename);
    }
}

module.exports = { transform, installRequireHook, uninstallRequireHook };
