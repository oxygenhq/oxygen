const babel = require('@babel/core');
const modulesCommonjsPlugin = require('@babel/plugin-transform-modules-commonjs');
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

// Array.prototype methods that invoke their callback synchronously and use its return value
// synchronously: a boolean for filter/some/every/find*, a comparison number for sort, an
// accumulator for reduce*, a mapped value for map/flatMap. None of them await, collect, or
// otherwise wait on a Promise their callback might return - so marking such a callback async
// doesn't make it awaited, it just changes what these methods receive. filter/some/every/find*
// get a Promise object instead of the real boolean, which is always truthy, so filter keeps
// everything and find/some/every effectively always match. map/flatMap build an array of
// unresolved Promises instead of the mapped values - and since nothing here (there's no
// Promise.all inserted) ever resolves those elements, a later .sort() on that array hands its
// comparator two Promise objects with none of the properties the real values would have had.
// That's exactly the failure mode this was added for: a .map(...).sort(...) chain whose
// comparator read .mtime off what turned out to be a Promise, not the file's stat.
// Unlike .execute() (see isBrowserExecuteCallback above), nothing here serializes the callback
// for a different runtime - it always runs in this same Node process - so there's no reason to
// leave it async: these methods can't wait for async work inside their callback regardless.
const SYNC_ARRAY_CALLBACK_METHODS = new Set([
    'map', 'filter', 'sort', 'forEach', 'reduce', 'reduceRight',
    'some', 'every', 'find', 'findIndex', 'findLast', 'findLastIndex', 'flatMap'
]);

function isSyncArrayCallback(path) {
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
    return SYNC_ARRAY_CALLBACK_METHODS.has(propertyName);
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
                if (isBrowserExecuteCallback(path) || isSyncArrayCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            FunctionExpression(path) {
                if (isBrowserExecuteCallback(path) || isSyncArrayCallback(path)) { path.skip(); return; }
                if (!path.node.async) path.node.async = true;
            },
            ArrowFunctionExpression(path) {
                if (isBrowserExecuteCallback(path) || isSyncArrayCallback(path)) { path.skip(); return; }
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
                if (isBrowserExecuteCallback(path) || isSyncArrayCallback(path)) { path.skip(); return; }
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
            // 'unambiguous' lets Babel parse either plain CommonJS scripts (require()/
            // module.exports, the common case) or ES module syntax (import/export) in the
            // same file, detected from whichever the file actually uses - 'script' rejected
            // import/export outright ("'import' and 'export' may appear only with
            // sourceType: 'module'"), which broke any test or page-object file written with
            // ES module syntax instead of require()/module.exports.
            sourceType: 'unambiguous',
            parserOpts: {
                // top-level return is valid in CommonJS module context and inside our async IIFE wrapper
                allowReturnOutsideFunction: true,
            },
            plugins: [
                // mod._compile() below always runs the *output* as CommonJS - it has no
                // knowledge of ES modules at all - so import/export need to actually be
                // converted to require()/exports.x, not just parsed. Without this, a file
                // using import/export would parse fine now but throw "Cannot use import
                // statement outside a module" the moment Node tried to run the transformed
                // output.
                // Passed as the already-require()'d module, not the plugin's name string -
                // Babel resolves name strings by searching the filesystem starting from the
                // *calling test project's* cwd (since that's process.cwd() when this runs),
                // not from oxygen-cli's own install location, so it can't find its own
                // dependency there even though it's genuinely installed. Passing the resolved
                // module directly sidesteps that resolution entirely.
                modulesCommonjsPlugin,
                [createAsyncTransformPlugin(), { wrapInIIFE }]
            ],
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
        // the file back gave an object full of `undefined`s. Also matches ES `export`
        // syntax (`export class Foo`, `export default`, `export const x = ...`, `export
        // { x }`) for the same reason - a support file written with ES exports gets
        // converted to exports.x assignments by the commonjs-modules plugin, and those
        // need the same protection from being wrapped and overwritten.
        const hasModuleExports = /\bmodule\.exports\b|\bexports\s*\.\s*\w+\s*=|^\s*export\b/m.test(code);
        const transformed = transform(code, filename, !hasModuleExports);
        mod._compile(transformed, filename);
    } else {
        _originalJsExtension(mod, filename);
    }
}

module.exports = { transform, installRequireHook, uninstallRequireHook };
