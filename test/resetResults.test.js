// Runs against the compiled build (npm run compile), with Node's built-in test runner:
//   node --test test/resetResults.test.js
// Needs Node >= 22.12 like oxygen-cli itself.
const { test } = require('node:test');
const assert = require('node:assert');
const Oxygen = require('../build/core/OxygenCore').default;

test('resetResults() clears the previous case HAR files', () => {
    const oxygen = new Oxygen();
    // what the web module hands over at the end of a case that used the browser
    oxygen.resultStore.har = { 'Open page': '/tmp/.cb-attachments/har-1.json' };

    oxygen.resetResults();

    // a following case that never opens the browser must not report those files again
    assert.strictEqual(oxygen.resultStore.har, null);
    assert.deepStrictEqual(oxygen.resultStore.steps, []);
    assert.deepStrictEqual(oxygen.resultStore.logs, []);
    assert.deepStrictEqual(oxygen.resultStore.attachments, []);
});
