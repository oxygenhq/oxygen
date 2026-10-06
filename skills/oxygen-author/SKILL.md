---
name: oxygen-author
description: Turn a written manual test case into a working, verified Oxygen automated test — exploring the application, emitting the script, running it, and repairing failures until it passes. Use when given a manual test case, acceptance criteria, or a described scenario to automate.
user-invocable: true
---

# Authoring an Oxygen test from a manual test case

This skill orchestrates the other three. Load `oxygen-write` before
emitting any code, `oxygen-setup` when the project layout is unclear,
and `oxygen-triage` on every failed run.

> **Status.** The interactive session in step 2 is available:
> `oxygen session start`, `oxygen web snapshot`, and `oxygen web <command>`.
> The Oxygen MCP server is not built yet, so drive the session through the
> CLI for now.

## The rule that matters most

**Never write a test from the manual case alone.** A manual step says "click
Sign in"; it does not say whether that is `id=signin`, a `button[type=submit]`,
or a link. Locators guessed from prose are wrong most of the time, and a test
built on them fails in ways that look like application bugs.

Ground every locator in the actual application before it reaches a file.

## 1. Read the manual case and identify the steps

Extract the discrete steps and, for each, what is being *done* and what is being
*checked*. Keep the original wording — it becomes the transaction names, and
that is what makes the report readable to whoever wrote the case.

Note the preconditions (logged in? specific data?), the test data, and the
expected end state. If the manual case is ambiguous about something that changes
the test — which user account, which environment, what counts as success — ask
now rather than guessing.

## 2. Explore the application

**Ask who will drive the browser** before starting an interactive session,
unless the request already makes it clear. There are two different things a
user can mean:

1. **You drive, they direct.** They describe the steps in chat; you run
   `oxygen web ...` commands and they watch.
2. **They drive, you record.** They do the steps themselves in the browser
   window, and you capture what they do.

Ask in one short question, for example: "Do you want to tell me the steps
here and have me click through them, or do them yourself in the browser while
I record?" Both modes need a visible browser, so start the session **without**
`--headless` either way. When the user drives, follow
**Recording what the user does** below, then continue from step 3 with the
saved file as the draft script.

**With a live session:** open the app, snapshot, act, snapshot again, walking
the manual steps by hand. Each snapshot gives roles, accessible names, and a
suggested durable locator per element. Record what actually works — including
waits that turn out to be necessary.

```bash
oxygen session start https://www.example.com/login   # add --headless only if nobody watches
oxygen web snapshot
#   textbox  "Username"  ref=e1  id=user-name
#   textbox  "Password"  ref=e2  id=password
#   button   "Login"     ref=e3  id=login-button

oxygen web type "ref=e1" "tester"
oxygen web type "ref=e2" "secret"
oxygen web click "ref=e3"
oxygen web snapshot          # confirm where the click landed

oxygen session steps         # everything executed, in order
oxygen session close
```

**Headless or visible is the user's choice.** `--headless` is only the default
when nobody is watching. Leave it off and open a visible browser when the user
asks for interactive mode, wants to see or watch the browser, asks for a demo
or walkthrough, or needs to act in the browser themselves (log in, enter an
MFA code, solve a CAPTCHA, look at a page). What the user asks for overrides
every `--headless` example in this guidance. A running session cannot switch
modes: if the user wants to see a session that was started headless, run
`oxygen session close` and start it again without `--headless`. If you cannot
tell whether they want to watch, ask.

### Recording what the user does

```bash
oxygen session start https://app.example.com/login   # visible: no --headless
oxygen session record start                           # injects the listener
#   ... the user works in the browser ...
oxygen session record status                          # what has been captured so far
oxygen session record stop
oxygen session save cases/<name>.js
```

After `record start`, tell the user the browser is ready and to say in chat when
they are done. Then wait. Do not send `oxygen web` commands meanwhile: they are
kept out of the recording, but they still move the page under the user's hands.
Run `record status` only if the user asks how it is going.

The listener survives page loads and captures clicks, typing, dropdown
selections, checkboxes and Enter. Going straight to a URL becomes `web.open`.
Before saving, read the output of `record stop` and fix what it flags:

- **Passwords are never recorded.** The step has `TODO` in place of the value.
  Replace it with a `secret:` reference or an environment value. Never ask the
  user for the password.
- **`no stable locator`** means the element had nothing durable on it, so an
  absolute XPath was recorded. Take a `snapshot` on that page, or check the
  page objects, and replace it before the test is committed.
- **Not captured:** hover, drag-and-drop, right-click, native browser dialogs,
  anything inside an iframe, and the path of a file the user picked
  (`fileBrowse` gets a `TODO`). If the user did any of these, ask them what
  they did and add the step by hand.

A recording is a draft, like any saved session. Run it from a clean browser
before calling it done (`--headless` is fine for that run, unless the user
wants to watch it).

Act through `ref`, but record the `locator` column — that is what goes in the
test. On a large page, `oxygen web snapshot '{"viewportOnly":true}'` cuts it
to what is on screen.

Snapshot output is grouped by page region (`[navigation]`, `[dialog]`,
`[menu]`), and a popup is listed directly under the control that opens it
rather than wherever the framework rendered it in the DOM. So after clicking a
menu button, its items are the next lines — not fifty lines further down.

**In an existing project, reuse its page objects rather than retyping them.**
The session loads `oxygen.po.js`, so whatever the tests already do is one
command away:

```bash
oxygen po                                    # what the project exposes
oxygen po Login po:GeneralCust.custNo1 po:GeneralCust.email1 secret:GeneralCust.pwd1
```

Three argument prefixes reference the project instead of carrying a literal,
and are resolved inside the session:

| Prefix | Resolves to |
|---|---|
| `po:PATH` | a value from the page object file |
| `secret:PATH` | an encrypted page object value, decrypted in the session |
| `env:NAME` | a value from the selected environment |

Use `secret:` for every credential. `utils.decrypt` returns a `DecryptResult`
object, not a string — passing one through a shell yields the literal text
`DecryptResult { ... }`, which gets typed into the password field and the
login silently fails. With `secret:` the plaintext is created inside the
session, never crosses the socket, and steps show it as `ENCRYPTED`.

`oxygen session save <file>` then writes the walkthrough out as a test, with
refs resolved to durable locators and exploration-only commands dropped. It
exits 2 when some element had no stable locator, and marks each such line with
a TODO — treat that as a draft, not a finished test.

**Without a live session** (today): inspect the application's DOM through
whatever means are available — browser devtools, the page source, an existing
test that touches the same screens. Prefer reusing locators already proven in
the project's `oxygen.po.js` over inventing new ones; existing page objects are
evidence about the application, and reusing them keeps the suite coherent.

If you cannot reach the application at all, **say so and stop before emitting a
script.** A test written from prose with invented locators is worse than no test
— it will be debugged as though it were real. Producing a clearly-labelled
skeleton with the locators marked as unverified is acceptable if the user asks
for it; presenting it as a working test is not.

## 3. Emit the script

Follow `oxygen-write` exactly. Specifically:

- One transaction per manual step, named with the manual step's wording.
- Locators go into `po/<page>.js` and are referenced as `po.page.element` —
  never inline, never a `ref=` handle (those are live-session only).
- Data goes into parameters or the environment, referenced as `${name}` —
  not hardcoded.
- Credentials via `utils.encrypt` / `utils.decrypt`.
- `assert*` for preconditions that make later steps meaningless if wrong;
  `verify*` for independent checks.
- No hand-written `async`/`await`; no commands in constructors, getters, or
  callbacks.

Place the file per `oxygen-setup`: `cases/<feature>.js`, added to the
relevant `suites/*.json`.

## 4. Run it clean

Run from a fresh browser, the way CI will — not from the exploration session,
which carries state that will mask failures.

```bash
oxygen cases/<feature>.js
```

Use the machine-readable reporter when available (`--rf=json`) to read step
results directly rather than parsing an HTML report.

## 5. Repair

Apply `oxygen-triage`. In short: classify the failure as test defect or
application bug; never modify the test to accommodate a real bug; inspect actual
page state before replacing a locator; change one thing at a time; re-run the
single test.

## 6. Know when to stop

Stop and hand back when **any** of these is true:

- The test passes twice consecutively from a clean state. One green run after a
  timing change proves very little.
- The same failure survives three repair attempts.
- The fix would require weakening an assertion the manual case clearly intends.
- Results alternate between pass and fail across identical runs — flakiness is
  its own defect and must be reported, not smoothed over with retries or added
  waits.
- The application appears genuinely broken.

Then report honestly: what passes, what does not, which locators were verified
against the live application and which were inferred, and any manual step that
could not be automated and why. A test suite whose true state is unclear is
worse than a smaller one that is trusted.

**Automated tests are never merged unreviewed.** Present the result for review;
do not commit or push unless explicitly asked.

## Worked shape

Manual case:

> 1. Navigate to the login page
> 2. Enter valid credentials and submit
> 3. Verify the dashboard is displayed with a welcome message

Becomes:

```js
// cases/login.js
web.transaction('1. Navigate to the login page');
web.init();
web.open('${baseUrl}/login');

web.transaction('2. Enter valid credentials and submit');
web.type(po.login.username, '${username}');
web.type(po.login.password, utils.decrypt('${passwordEnc}'));
web.click(po.login.submit);

web.transaction('3. Verify the dashboard is displayed with a welcome message');
web.waitForVisible(po.dashboard.header);
web.assertTitle('Dashboard');
web.verifyText(po.dashboard.welcome, 'glob:Welcome*');
```

with `po/loginPage.js` and `po/dashboardPage.js` holding locators confirmed
against the running application, and `username` / `passwordEnc` supplied by
`cases/login.csv` or the environment.
