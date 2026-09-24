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

// Global module namespaces exposed to user scripts. Every command on one of these is
// async - either a built-in Oxygen command, or a page-object/support function, which
// this same transform also unconditionally marks async (see the FunctionDeclaration/
// FunctionExpression/ArrowFunctionExpression/ObjectMethod visitors below) - so a call to
// any of these can never safely be left un-awaited. 'po' covers the page-object namespace
// itself (e.g. po.encryption.getEncryptedValue(...)), not just its own commands.
const OXYGEN_NAMESPACES = new Set([
    'web', 'mob', 'win', 'log', 'assert', 'utils', 'db', 'http', 'email', 'eyes',
    'pdf', 'proxy', 'soap', 'serial', 'shell', 'mailinator', 'mongo', 'twilio', 'date', 'po'
]);

// true if `node` is a call whose callee is rooted at one of the namespaces above -
// web.click(...), log.info(...), po.encryption.getEncryptedValue(...), etc. - regardless
// of how many .property hops separate the root identifier from the call itself.
function isOxygenNamespaceCall(node) {
    let callee = node.callee;
    while (callee && callee.type === 'MemberExpression') {
        callee = callee.object;
    }
    return !!callee && callee.type === 'Identifier' && OXYGEN_NAMESPACES.has(callee.name);
}

// object/class methods with these `kind`s can never be declared `async`
// (constructors can't be async; getters/setters must return a value/accept a
// setter argument synchronously per the language spec) — marking one async,
// or awaiting a call inside one, is a syntax error.
function isNonAsyncableMethod(node) {
    return !!node && (node.kind === 'constructor' || node.kind === 'get' || node.kind === 'set');
}

// true if `node` is a direct call to the real, un-renamed `require(...)` —
// not `require.resolve(...)` (callee is a MemberExpression, not an Identifier)
// and not an already-rewritten call (see OXYGEN_REQUIRE_HELPER_NAME below).
function isRequireCall(node) {
    return !!node.callee && node.callee.type === 'Identifier' && node.callee.name === 'require' &&
        node.arguments.length >= 1;
}

const OXYGEN_REQUIRE_HELPER_NAME = '__oxygenRequire';

// Builds the runtime helper this plugin rewrites require() calls to go through
// (see the CallExpression visitor). It does the real, synchronous require(id)
// exactly as before, then — only if the result carries a `__ready` promise (see
// the Program.enter wrapping below) — returns that promise instead, resolving to
// the module once it's actually finished its top-level work. Ordinary requires
// (npm packages, plain data/page-object files with no top-level Oxygen calls)
// have no `__ready`, so this is a transparent passthrough for them.
function buildOxygenRequireHelperDecl(t) {
    const idParam = t.identifier('id');
    const mVar = t.identifier('m');
    const mDecl = t.variableDeclaration('var', [
        t.variableDeclarator(mVar, t.callExpression(t.identifier('require'), [idParam]))
    ]);
    const readyMember = t.memberExpression(mVar, t.identifier('__ready'));
    const thenMember = t.memberExpression(readyMember, t.identifier('then'));
    const condition = t.logicalExpression('&&',
        t.logicalExpression('&&',
            mVar,
            t.binaryExpression('===', t.unaryExpression('typeof', mVar), t.stringLiteral('object'))
        ),
        t.logicalExpression('&&',
            readyMember,
            t.binaryExpression('===', t.unaryExpression('typeof', thenMember), t.stringLiteral('function'))
        )
    );
    const thenCallback = t.functionExpression(null, [], t.blockStatement([t.returnStatement(mVar)]));
    const ifStmt = t.ifStatement(
        condition,
        t.blockStatement([t.returnStatement(t.callExpression(thenMember, [thenCallback]))])
    );
    return t.functionDeclaration(
        t.identifier(OXYGEN_REQUIRE_HELPER_NAME),
        [idParam],
        t.blockStatement([mDecl, ifStmt, t.returnStatement(mVar)])
    );
}

// true if `node` (a top-level statement of a Program) contains an Oxygen-namespace
// call directly at that top level — i.e. not nested inside any function, where it
// would already be safely awaited on its own.
function programHasTopLevelOxygenCall(programPath) {
    let found = false;
    programPath.traverse({
        Function(fnPath) {
            fnPath.skip();
        },
        CallExpression(callPath) {
            if (isOxygenNamespaceCall(callPath.node)) {
                found = true;
                callPath.stop();
            }
        }
    });
    return found;
}

// Helper functions @babel/plugin-transform-modules-commonjs injects at the top level of a
// file that uses `import x from` / `import * as x from` (e.g. `function _interopRequireDefault(e)
// { return e && e.__esModule ? e : { default: e }; }`). They are plain synchronous utilities
// called as `_x = _interopRequireDefault(require(...))` - marking one async turns the imported
// module into a Promise, so `x.default` is undefined and every use of it fails with
// "Cannot read properties of undefined". They aren't user code, so leave them (and their
// bodies) untouched.
const BABEL_MODULE_HELPERS = new Set([
    '_interopRequireDefault', '_interopRequireWildcard', '_getRequireWildcardCache'
]);

function isBabelModuleHelper(path) {
    return !!path.node.id && BABEL_MODULE_HELPERS.has(path.node.id.name) && path.parentPath.isProgram();
}

function createAsyncTransformPlugin() {
    return ({ types: t }) => ({
        visitor: {
            FunctionDeclaration(path) {
                if (isBabelModuleHelper(path)) { path.skip(); return; }
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
                // an async IIFE, UNLESS their top level contains an Oxygen call (see
                // Program.enter below, which wraps exactly that case into
                // `module.exports.__ready = (async () => {...})()`) — awaiting a call
                // sitting directly at an otherwise-unwrapped top level would introduce
                // genuine top-level await, turning the compiled file into an ES module
                // and breaking any later synchronous require() of it
                // (ERR_REQUIRE_ASYNC_MODULE). Calls inside nested functions, or inside
                // a Program.enter-wrapped top level, are unaffected — both have a real
                // function parent to await inside.
                const functionParent = path.getFunctionParent();
                const nonAsyncable = !!functionParent && isNonAsyncableMethod(functionParent.node);
                const willBeAwaited = (state.opts.wrapInIIFE || !!functionParent) && !nonAsyncable;
                // require() itself is never async - but the module it returns may carry
                // a `__ready` promise (see Program.enter) that isn't actually settled
                // yet. Route through a helper that awaits `__ready` when present, but
                // only where the result of doing so will actually be awaited below -
                // otherwise (a require() that stays un-awaited, same as before) the
                // helper could hand back a raw, unresolved Promise in place of the
                // module object it used to return synchronously, which is worse than
                // today's behavior, not better.
                if (willBeAwaited && isRequireCall(path.node)) {
                    path.node.callee = t.identifier(OXYGEN_REQUIRE_HELPER_NAME);
                    state.needsOxygenRequireHelper = true;
                }
                if (!willBeAwaited) {
                    if (!state.opts.wrapInIIFE && !functionParent && isOxygenNamespaceCall(path.node)) {
                        // Defensive fallback: Program.enter (below) wraps any file whose
                        // top level contains an Oxygen call, which should make this
                        // unreachable in practice - but fail loudly rather than silently
                        // hand back an unresolved Promise if some case slips through.
                        throw path.buildCodeFrameError(
                            'This command can\'t be used here - only inside a function. Move it into a ' +
                            'function (e.g. module.exports.myFunction = () => { ... }), then call that ' +
                            'function from your test.'
                        );
                    }
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
                enter(path, state) {
                    // wrapInIIFE files (test entry scripts) get their whole top level
                    // wrapped unconditionally in Program.exit below - nothing to do here.
                    if (state.opts.wrapInIIFE) return;
                    // A support/page-object file (wrapInIIFE === false) normally keeps its
                    // top level exactly as written, running synchronously the instant
                    // require() loads it - that's what lets require() stay synchronous.
                    // But if that top level itself calls into an Oxygen namespace, the
                    // call can never safely be left un-awaited (see the CallExpression
                    // visitor above), so instead wrap the whole top level in an async
                    // IIFE and hand callers a promise to wait on: any require()'d module
                    // exposing `module.exports.__ready` isn't fully populated until that
                    // promise resolves. This must run before the CallExpression visitor
                    // reaches these calls (hence Program.enter, not exit) so that, by the
                    // time it does, they already have a real function parent to await
                    // inside - this new arrow function.
                    if (!programHasTopLevelOxygenCall(path)) return;
                    const body = [...path.node.body];
                    const asyncIIFE = t.callExpression(
                        t.arrowFunctionExpression([], t.blockStatement(body), true),
                        []
                    );
                    const readyStmt = t.expressionStatement(
                        t.assignmentExpression('=',
                            t.memberExpression(
                                t.memberExpression(t.identifier('module'), t.identifier('exports')),
                                t.identifier('__ready')
                            ),
                            asyncIIFE
                        )
                    );
                    path.node.body = [readyStmt];
                },
                exit(path, state) {
                    if (state.needsOxygenRequireHelper) {
                        path.node.body.unshift(buildOxygenRequireHelperDecl(t));
                    }
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
