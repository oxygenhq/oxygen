// Runs against the compiled build (npm run compile), with Node's built-in test runner:
//   node --test test/executeTestHook.test.js
// util.js imports ESM-only dependencies, so this needs Node >= 22.12 like oxygen-cli itself.
const { test } = require('node:test');
const assert = require('node:assert');
const Module = require('module');
const oxutil = require('../build/lib/util');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test('overlapping hooks leave require() as it was', async () => {
    const originalRequire = Module.prototype.require;
    // The second hook wraps the first hook's wrapper; when the first one finishes first, a
    // per-call save/restore puts the original back and then the second puts the first
    // hook's wrapper back - which is the leak this guards against.
    const hooks = {
        beforeCommand: () => delay(5),    // starts first, finishes first
        afterCommand: () => delay(30),
    };

    const first = oxutil.executeTestHook(hooks, 'beforeCommand', []);
    const second = oxutil.executeTestHook(hooks, 'afterCommand', []);
    await Promise.all([first, second]);

    assert.ok(Module.prototype.require === originalRequire, 'require() was left wrapped');
});

test('many concurrent hooks do not leak require() wrappers', async () => {
    const originalRequire = Module.prototype.require;
    const hooks = { afterCommand: () => delay(Math.random() * 10) };

    await Promise.all(Array.from({ length: 200 }, () => oxutil.executeTestHook(hooks, 'afterCommand', [])));

    assert.ok(Module.prototype.require === originalRequire, 'require() was left wrapped');
});

test('require("chai") resolves inside every running hook', async () => {
    let chaiInSlowHook = null;
    let chaiInFastHook = null;
    const hooks = {
        beforeCommand: async () => { await delay(20); chaiInSlowHook = require('chai'); },
        afterCommand: async () => { chaiInFastHook = require('chai'); },
    };

    await Promise.all([
        oxutil.executeTestHook(hooks, 'beforeCommand', []),
        oxutil.executeTestHook(hooks, 'afterCommand', []),
    ]);

    assert.ok(chaiInSlowHook && typeof chaiInSlowHook.expect === 'function');
    assert.strictEqual(chaiInSlowHook, chaiInFastHook);
});

test('a hook that throws still restores require()', async () => {
    const originalRequire = Module.prototype.require;
    const hooks = { beforeCase: () => { throw new Error('hook failure'); } };

    const consoleError = console.error;
    console.error = () => {};
    try {
        await assert.rejects(oxutil.executeTestHook(hooks, 'beforeCase', []), /hook failure/);
    }
    finally {
        console.error = consoleError;
    }

    assert.ok(Module.prototype.require === originalRequire, 'require() was left wrapped');
});
