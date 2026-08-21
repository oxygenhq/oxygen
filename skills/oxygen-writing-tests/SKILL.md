---
name: oxygen-writing-tests
description: Write or modify Oxygen test scripts — the async transformer rules, locator strategy, page objects, transactions, assert vs verify, waits, parameters and encrypted credentials. Use whenever authoring, editing, or reviewing a .js test file or page object in an Oxygen project.
---

# Writing Oxygen tests

Oxygen test scripts are **not** ordinary Node.js, and they are **not**
WebdriverIO or Playwright. Read the first section before writing a single line;
it is the rule most often broken by anyone coming from another framework.

## 1. Scripts are transformed — do not write async/await

Before execution, Oxygen Babel-transforms every test script and every file it
requires: each function is marked `async` and each call is wrapped in `await`
(`src/core/scriptTransformer.js`). Test code is therefore written to look
synchronous.

```js
// CORRECT — this is what an Oxygen test looks like
web.init();
web.open('${baseUrl}/login');
web.type(po.login.username, 'tester');
web.click(po.login.submit);
const title = web.getTitle();
log.info(title);
```

Writing `await` explicitly is harmless but redundant. The real failures come
from three places the transformer deliberately skips.

**Never put Oxygen commands in a constructor, getter, or setter.** These cannot
be made `async` in JavaScript, so the transformer leaves them alone — calls
inside them return unresolved Promises instead of values, with no error.

```js
// BROKEN — this.title is a Promise, and the failure appears later, elsewhere
class LoginPage {
    constructor() { this.title = web.getTitle(); }
    get heading() { return web.getText('h1'); }
}

// CORRECT — plain methods transform normally
class LoginPage {
    getTitle()   { return web.getTitle(); }
    getHeading() { return web.getText('h1'); }
}
```

**Never iterate with a callback.** The callback is marked `async`, but
`forEach`/`map`/`filter` do not wait for it, so the surrounding code runs on
ahead. Commands themselves are serialized by a global queue
(`OxygenCore.js:583`), so this is not a data race — but ordering against
subsequent statements is not guaranteed, which is worse to debug.

```js
// BROKEN
users.forEach(u => web.type(po.login.username, u));

// CORRECT
for (const u of users) {
    web.type(po.login.username, u);
}
```

**Never touch Oxygen commands inside a `web.execute()` callback.** That function
is serialized and injected into the browser, where `web`, `po` and Node globals
do not exist. The transformer skips it so it reaches the page exactly as
written. Use only browser globals, and return a serializable value.

```js
const scrollY = web.execute(function () {
    return window.scrollY;          // browser scope — no web.*, no po.*
});
```

## 2. Every module needs init()

Calling any command on an uninitialized module throws
`MODULE_NOT_INITIALIZED_ERROR: Missing web.init()`. There is no implicit
initialization.

```js
web.init();                 // capabilities come from oxygen.conf.js
web.open('${baseUrl}');
```

`web.init(caps)` accepts capabilities that merge over the config's. Modules that
need no session (`log`, `assert`, `utils`, `date`) are usable immediately.

`web.dispose()` is a real command, but a test should not call it. The runner
disposes modules after each case on its own, so a trailing `dispose()` is
redundant — and one placed mid-script ends the session, making every command
after it fail with `MODULE_NOT_INITIALIZED_ERROR`.

## 3. Locators

Every element-taking command accepts these prefixes:

| Prefix | Meaning |
|---|---|
| `id=NAME` | element id |
| `css=SELECTOR` | CSS selector |
| `name=NAME` | name attribute |
| `link=TEXT` | link with exactly this visible text |
| `link-contains=TEXT` | link containing this text |
| `tag=NAME` | tag name |
| `/xpath` or `(xpath)[n]` | XPath 1.0 — anything starting with `/` |

An unprefixed string is treated as XPath if it starts with `/`, otherwise passed
through as-is. Always use an explicit prefix; it costs nothing and removes the
ambiguity.

**Preference order**, most to least durable:

1. `id=` — if the id is stable and not framework-generated
2. `css=[data-testid="..."]` — or whatever test-hook attribute the app uses
3. `css=` on semantic structure — `css=form.login button[type=submit]`
4. `link=` / `link-contains=` for links, when the text is stable copy
5. XPath — last resort, and never a full absolute path

Reject anything that looks generated: `id=mat-input-3`, `css=.css-1x2y3z`,
`/html/body/div[3]/div[2]/form/div[1]/input`. These break on the next build.
If nothing durable exists, say so and recommend adding a `data-testid` to the
application rather than silently writing a brittle locator.

Commands taking a text pattern accept `regex:`, `regexi:` (case-insensitive),
`exact:`, and `glob:`. A bare string is glob-matched, so `*` and `?` are
wildcards — use `exact:` when the text legitimately contains them.

### Finding locators: web.snapshot()

Do not guess a locator. `web.snapshot()` returns every actionable element on
the current page with its role, accessible name, current state, and a
**suggested durable locator** — the thing that belongs in the test.

```js
const page = web.snapshot();
// page.elements: [{ ref: 'ref=e1', role: 'textbox', name: 'Username', locator: 'id=user-name' }, ...]
```

Options: `{ maxElements: 200, all: false, viewportOnly: false }`. `all` adds
headings and labels; `viewportOnly` restricts to what is on screen, which is
the fastest way to cut a large page down.

Each element carries two locators and they are not interchangeable:

| Field | Use |
|---|---|
| `locator` | Durable — `id=`, a test attribute, `name=`. **This is what goes in the test.** |
| `ref` | A handle for the page as it is right now. For acting during exploration only. |

**A `ref` must never appear in a saved test.** Refs are numbered per session
and never reused, so one from an earlier snapshot resolves to nothing and
fails with `ELEMENT_NOT_FOUND` rather than silently hitting the wrong element
— but a ref committed to a file is a test that cannot pass.

When `locator` is empty, the element has nothing stable to hang a locator on.
Say so and recommend adding a `data-testid` to the application rather than
falling back to an absolute XPath.

## 4. Page objects

`oxygen.po.js` exports an object that becomes the global `po`. That is the whole
mechanism — Oxygen imposes no shape on it, so use this one consistently.

Group by page, then by element. Keep locators as plain strings, and keep
behaviour out of the repository:

```js
// po/loginPage.js
module.exports = {
    username: 'id=user',
    password: 'id=pass',
    submit:   'css=form.login button[type=submit]',
    error:    'css=.login-error',
};

// oxygen.po.js
module.exports = {
    login:     require('./po/loginPage'),
    dashboard: require('./po/dashboardPage'),
};
```

Used as `web.type(po.login.username, 'tester')`.

For multi-step flows, add a plain function module under `lib/` that uses `po` —
do not put action methods on the repository object, because everything on `po`
is read as a locator by anyone scanning the file.

```js
// lib/loginFlow.js
module.exports.loginAs = function (user, pass) {
    web.type(po.login.username, user);
    web.type(po.login.password, pass);
    web.click(po.login.submit);
    web.waitForVisible(po.dashboard.header);
};
```

Rules that matter: one file per page; no commands in constructors or getters
(section 1); never a session-scoped `ref=` handle in a committed page object —
those are valid only inside the live session that produced them.

## 5. Transactions map to manual test steps

`web.transaction(name)` opens a named transaction that stays open until the next
one. Steps are grouped under it in the report, and performance data is collected
per transaction.

When a test comes from a written manual test case, **emit one transaction per
manual step, named with that step's wording.** This is the cheapest traceability
you will ever get, and it makes a failure report readable by whoever wrote the
manual case.

```js
web.transaction('1. Open the login page');
web.open('${baseUrl}/login');

web.transaction('2. Sign in with valid credentials');
web.type(po.login.username, '${username}');
web.type(po.login.password, password);
web.click(po.login.submit);

web.transaction('3. Verify the dashboard loads');
web.waitForVisible(po.dashboard.header);
web.assertTitle('Dashboard');
```

Transaction names must be unique within a test. `mob`, `http` and `utils` have
their own `transaction` command.

## 6. assert* aborts, verify* continues

This is a real behavioural difference, not a naming preference. `assert*` raises
a fatal error and the test stops. `verify*` records a failed step and execution
continues (`OxygenCore.js:679`).

```js
web.assertTitle('Dashboard');        // wrong page -> stop, nothing after runs
web.verifyText(po.cart.total, '$42'); // mismatch -> step fails, test continues
```

Use `assert*` for preconditions — if this is wrong, everything after it is
meaningless. Use `verify*` to collect several independent checks in one run.

Note that `verify*` commands still throw `ELEMENT_NOT_FOUND` fatally if the
element is missing entirely; only the comparison itself is non-fatal. The
`continueOnError` config option makes assertion failures non-fatal too — leave
it off unless a project has explicitly asked for it.

The `assert` module (`assert.equal`, `assert.fail`, …) covers non-UI assertions.

## 7. Waiting

Element commands already wait — up to 60 seconds by default — for the element to
exist and become visible. Do not add your own polling, and never call
`web.pause()` to wait for something.

```js
// WRONG — flaky and slow at the same time
web.pause(5000);
web.click(po.dashboard.header);

// RIGHT — waits exactly as long as needed
web.waitForVisible(po.dashboard.header);
web.click(po.dashboard.header);
```

Explicit waits when you need them: `waitForVisible`, `waitForExist`,
`waitForNotExist`, `waitForText`, `waitForValue`, `waitForInteractable`,
`waitForWindow`. Change the global default with `web.setTimeout(ms)`, or pass a
per-command timeout as the last argument.

`web.pause()` is legitimate only for a deliberate settle after an animation with
no observable end state — and it deserves a comment saying so.

## 8. Parameters and environments

Any string argument is scanned at execution time for `${name}` and substituted
from parameters first, then environment variables
(`OxygenCore._replaceParameterInArgument`).

```js
web.open('${baseUrl}/login');          // from oxygen.env.js
web.type(po.login.username, '${username}');  // from the parameters file
```

Prefer this over JS template literals: it keeps data out of code, and the
substituted values appear correctly in reports. `params.username` and
`env.baseUrl` are also available as objects when you need them in an expression.

A parameters file auto-pairs with a test by filename — `cases/login.js` picks up
`cases/login.csv` or `cases/login.txt` with no configuration. Explicit files
(`-p data/users.xlsx`) also accept `.xlsx`, `.xls` and `.json`. Each row is one
iteration; column headers become parameter names.

## 9. Credentials

Never write a password, token, or key in plaintext — not in a test, a page
object, an environment file, or a data file.

```js
// once, offline, to produce the ciphertext to commit:
//   utils.encrypt('s3cret') -> 'b757ba2c2fc50f...'

const password = utils.decrypt('b757ba2c2fc50f...');
web.type(po.login.password, password);   // real value reaches the browser
log.info(password);                       // prints ENCRYPTED
```

`utils.decrypt` returns a wrapper, not a string. Commands unwrap it
transparently; logs and step results show `ENCRYPTED`. Call
`.getDecryptResult()` only when you genuinely need the plaintext in an
expression — and never log the result.

## 10. Shape of a test file

```js
// cases/login.js
web.transaction('1. Open the application');
web.init();
web.open('${baseUrl}/login');

web.transaction('2. Sign in');
web.type(po.login.username, '${username}');
web.type(po.login.password, utils.decrypt('${passwordEnc}'));
web.click(po.login.submit);

web.transaction('3. Confirm the dashboard');
web.waitForVisible(po.dashboard.header);
web.assertTitle('Dashboard');
web.verifyText(po.dashboard.welcome, 'glob:Welcome*');
```

No wrapper function, no exports, no describe/it — the file body **is** the test.
Suites group files; see the `oxygen-project-setup` skill.

## Before finishing

Check the script against each of these. They are the errors that actually recur:

- No `async`/`await` added by hand, and no commands in a constructor, getter,
  setter, or `forEach` callback
- `web.init()` present; no explicit `web.dispose()`
- Locators live in `po`, are prefixed, and none is auto-generated or an absolute
  XPath
- No `ref=` locator anywhere — those are live-session handles only
- One transaction per manual test step, uniquely named
- `assert*` for preconditions, `verify*` for independent checks
- No `web.pause()` standing in for a wait
- No plaintext credentials

Then run it. `oxygen cases/login.js` — a test that has not been executed is a
draft, and should be described as one.
