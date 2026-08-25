---
description: "Drive the application by hand in a live browser session"
---

# Walk through the application in a live session

A session keeps one browser open so commands can be sent to it one at a time —
the same worker a test run uses, so what works here works in a test.

```bash
oxygen session start --env=dev --headless    # --headless keeps it off your screen
oxygen web snapshot                          # every actionable element
oxygen web click "id=login-button"
oxygen session steps                         # everything run, in order
oxygen session save cases/new.js             # write it out as a test
oxygen session close --all
```

`$ARGUMENTS` is what the user wants to reach or try. If empty, ask.

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
