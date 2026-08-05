const babel = require('@babel/core');
const fs = require('fs');
const Module = require('module');

// true if `path` is a function passed directly as an argument to a `.execute(...)`
// call (e.g. `web.execute(function() { ... }, arg)`). Such functions are not run by
// Oxygen's own Node process at all — webdriverio serializes them (via .toString())
// and injects them into the browser page to run there, so they commonly reference
// browser-only globals (document, window, XPathResult, etc.) and must stay exactly
// as the user wrote them. Marking them async / wrapping their calls in await would
// change what actually executes in the browser: an async function returns a Promise
// immediately instead of the synchronous result WebDriver's execute-script expects.
function isBrowserExecuteCallback(path) {
    const parent = path.parent;
    if (!parent || parent.type !== 'CallExpression') {
        return false;
    }
    if (!parent.arguments.includes(path.node)) {
        return false;
    }
    const callee = parent.callee;
    if (!callee || callee.type !== 'MemberExpression') {
        return false;
    }
    const propertyName = callee.property && (callee.property.name || callee.property.value);
    return propertyName === 'execute';
}

// object/class methods with these `kind`s can never be declared `async`
// (constructors can't be async; getters/setters must return a value/accept a
// setter argument synchronously per the language spec) — marking one async,
// or awaiting a call inside one, is a syntax error.
function isNonAsyncableMethod(node) {
    return !!node && (node.kind === 'constructor' || node.kind === 'get' || node.kind === 'set');
}

function createAsyncTransformPlugin() {
    return ({ types: t }) => ({
        visitor: {
            FunctionDeclaration(path) {
                if (isBrowserExecuteCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            FunctionExpression(path) {
                if (isBrowserExecuteCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            ArrowFunctionExpression(path) {
                if (isBrowserExecuteCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            // ES2015 method-shorthand syntax (`{ foo() {...} }` in an object
            // literal, or a method inside a `class`) is represented by Babel as
            // ObjectMethod/ClassMethod/ClassPrivateMethod — a different node type
            // than FunctionExpression/ArrowFunctionExpression above, so it needs
            // its own visitor. Without this, such a method never gets marked
            // async, yet calls inside it still get wrapped in `await` by the
            // CallExpression visitor below (which only checks for *any* enclosing
            // function, not specifically an async-eligible one) — producing
            // "await is only valid in async functions" at runtime.
            ObjectMethod(path) {
                if (isNonAsyncableMethod(path.node)) return;
                if (isBrowserExecuteCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            ClassMethod(path) {
                if (isNonAsyncableMethod(path.node)) return;
                if (!path.node.async) path.node.async = true;
            },
            ClassPrivateMethod(path) {
                if (isNonAsyncableMethod(path.node)) return;
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
                const functionParent = path.getFunctionParent();
                if (!state.opts.wrapInIIFE && !functionParent) {
                    return;
                }
                // constructors/getters/setters can never be async — a call inside
                // one must stay un-awaited, since there's nowhere for the `await`
                // to legally live (see isNonAsyncableMethod above)
                if (functionParent && isNonAsyncableMethod(functionParent.node)) {
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

// cwd is unused for gating which files get transformed (see _hookHandler) but
// kept in the signature since callers already pass it and a future use may
// need it again.
function installRequireHook(cwd) { // eslint-disable-line no-unused-vars
    _originalJsExtension = Module._extensions['.js'];
    Module._extensions['.js'] = _hookHandler;
}

function uninstallRequireHook() {
    if (_originalJsExtension) {
        Module._extensions['.js'] = _originalJsExtension;
        _originalJsExtension = null;
    }
}

function _hookHandler(mod, filename) {
    // transform any user-authored file, regardless of where it lives on disk
    // (not just inside the test project's cwd) — page-object/support files
    // are commonly kept in a shared location outside the project folder
    // (e.g. a different drive or a company-wide base-functions repo), and
    // previously such files silently loaded untransformed: every await this
    // system relies on to keep command execution correctly sequenced was
    // missing, causing MODULE_NOT_INITIALIZED_ERROR ("Missing web.init()"),
    // stray Promise objects ending up in place of resolved values, etc.
    // node_modules is still excluded — third-party package internals aren't
    // meant to go through this transform.
    if (!filename.includes('node_modules')) {
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
