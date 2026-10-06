---
description: "Drive the application by hand in a live browser session"
---

# Walk through the application in a live session

A session keeps one browser open so commands can be sent to it one at a time —
the same worker a test run uses, so what works here works in a test.

```bash
oxygen session start --env=dev               # visible browser - the user can watch
oxygen web snapshot                          # every actionable element
oxygen web click "id=login-button"
oxygen session steps                         # everything run, in order
oxygen session save cases/new.js             # write it out as a test
oxygen session close --all
```

`$ARGUMENTS` is what the user wants to reach or try. If empty, ask.

## Who drives the browser

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
`--headless` either way.

When they will direct you, walk through it with the commands above. When they
will do it themselves, use recording.

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

## Visible or headless

**Headless or visible is the user's choice.** `--headless` is only the default
when nobody is watching. Leave it off and open a visible browser when the user
asks for interactive mode, wants to see or watch the browser, asks for a demo
or walkthrough, or needs to act in the browser themselves (log in, enter an
MFA code, solve a CAPTCHA, look at a page). What the user asks for overrides
every `--headless` example in this guidance. A running session cannot switch
modes: if the user wants to see a session that was started headless, run
`oxygen session close` and start it again without `--headless`. If you cannot
tell whether they want to watch, ask.

Add `--headless` only when the session is purely yours, e.g. exploring a page
to write a test while the user is not watching. It keeps the window from taking
keyboard focus on their screen.

## Reading a snapshot

Elements are grouped by page region (`[navigation]`, `[dialog]`, `[menu]`), and
a popup is listed directly under the control that opens it rather than wherever
the framework rendered it. After clicking a menu button, its items are the next
lines.

Each entry carries two locators: `ref=eN` addresses the element right now and
must never be written into a test, and `locator` is the durable suggestion that
belongs in `oxygen.po.js`. Narrow a large page with
`oxygen web snapshot '{"viewportOnly":true}'`.

## Use the project instead of retyping it

```bash
oxygen po                                    # what the page object file exposes
oxygen po Login po:Customer.number po:Customer.email secret:Customer.password
```

`po:` reads a page-object value, `env:` an environment value, and `secret:`
decrypts inside the session so the plaintext never crosses the shell — steps
show it as `ENCRYPTED`, exactly as in a test run.

## After a rebuild of Oxygen itself

A running session holds the compiled build in memory. Run
`oxygen session close --all` after rebuilding, or you will debug stale code.
