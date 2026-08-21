---
name: oxygen-triage-failures
description: Diagnose and fix a failing Oxygen test from its error code, message and step results — mapping Oxygen error types to likely causes and the correct repair. Use when an Oxygen run fails, when reading an Oxygen report or step result, or when deciding whether a failure is a test defect or a real application bug.
---

# Triaging Oxygen failures

Every Oxygen failure carries a typed error code, a message, and a `location`
pointing at the line in the test script. Read the code first — it narrows the
cause far faster than the message text does.

## Before changing anything: is this a test defect or a real bug?

This decision comes first, and getting it wrong is expensive in both directions.

A failure is **a real application bug** — report it, do not "fix" the test —
when the test faithfully expresses the intended behaviour and the application
does not deliver it. An `ASSERT_ERROR` reading `Expected: "Dashboard". Got:
"Login"` after a valid sign-in is a bug, not a locator problem.

A failure is **a test defect** when the test is asking for the wrong thing: a
stale locator, a missing wait, a wrong assumption about page state.

If you cannot tell, say so and present both readings. Never make a failing
assertion pass by weakening it — changing `assertText` to a laxer pattern, or
`assert*` to `verify*`, to get a green run is destroying the test's purpose.
Loosening an assertion is legitimate only when the original was over-specific
about something genuinely incidental, and that reasoning should be stated.

## Error code reference

### Element and locator failures

| Code | Message shape | Likely cause and fix |
|---|---|---|
| `ELEMENT_NOT_FOUND` | `Unable to find element: <locator>` | Wrong or stale locator; element in an iframe; page not loaded yet. Confirm the locator against the live page before editing. If the element is inside a frame, `web.selectFrame()` first. Waiting longer does **not** help — the command already waited 60s. |
| `ELEMENT_NOT_VISIBLE` | `Element not visible: <locator>` | Element exists but is hidden or off-screen. Usually a real timing or state problem, not a locator problem. `web.scrollToElement()`, or wait for the state that reveals it. `web.clickHidden()` only when the element is legitimately never visible. |
| `ELEMENT_NOT_INTERACTABLE` | driver message | Element is covered, disabled, or animating. Wait for the overlay to clear or the control to enable — `web.waitForInteractable()`. Do not reach for `clickHidden` to bypass a genuinely disabled control; that hides a real bug. |
| `STALE_ELEMENT_REFERENCE` | driver message | The DOM was replaced between finding the element and using it — common with SPAs. Re-find rather than caching: pass the locator string to each command instead of holding an `Element` across a navigation. |
| `LOCATOR_MATCHES_MULTIPLE_ELEMENTS` | — | The locator is not specific enough. Scope it to a container, do not add an index — an index is positional and will drift. |
| `ELEMENT_STILL_EXISTS` | — | `waitForNotExist` timed out. The element genuinely did not go away; check whether the action that should remove it actually fired. |
| `OPTION_NOT_FOUND` | — | `select`/`deselect` could not find the option. Check the label-vs-value distinction and whether options load asynchronously. |
| `ATTRIBUTE_NOT_FOUND` | — | The attribute is absent, not empty. Verify against the live DOM. |

### Assertion failures

| Code | Fatal | Meaning |
|---|---|---|
| `ASSERT_ERROR` | yes | `assert*` mismatch — `Expected: "x". Got: "y"`. Test stops here. |
| `VERIFY_ERROR` | no | `verify*` mismatch. Step recorded failed, execution continued — so look for later failures caused by this one. |

For both, check the pattern syntax before assuming an application fault. A bare
pattern is **glob**-matched, so `Total: $42` fails against text containing `*`
or `?` unless prefixed with `exact:`. `regex:`, `regexi:`, `exact:` and `glob:`
are the available prefixes.

### Script and framework failures

| Code | Likely cause and fix |
|---|---|
| `MODULE_NOT_INITIALIZED_ERROR` | `Missing web.init()` — a command ran before its module was initialized. Add `web.init()`. If it is already there, the real cause is usually a command in a constructor/getter or an un-awaited callback running out of order. |
| `SCRIPT_ERROR` | A JavaScript error in the test. Check `location` for the line. A `Promise`-shaped value here almost always means a command inside a constructor, getter, setter, or `forEach` callback — see the `oxygen-writing-tests` skill, section 1. |
| `BROWSER_JS_EXECUTE_ERROR` | The function passed to `web.execute()` threw in the browser. Remember it runs in page scope — no `web`, no `po`, no Node globals. |
| `PARAMETERS_ERROR` | Parameters file missing, unreadable, or an unsupported extension. Supported: `.csv`, `.txt`, `.xlsx`, `.xls`, `.json`, `.js`. Also raised when the table is empty. |
| `CRYPTO_ERROR` | `utils.decrypt` on a value that was not produced by `utils.encrypt`, or encrypted with a different key. |
| `HOOK_ERROR` | A hook in `oxygen.conf.js` threw. Note hooks load **only** from `oxygen.conf.js`, never `.json`. |
| `MODULE_NOT_FOUND` | A module was used that is not in the config's `modules` list, or a custom module failed to load. |
| `TIMEOUT` | A wait exceeded its limit. Prefer fixing the condition over raising the timeout. |

### Environment and session failures

These are almost never fixed by editing the test.

| Code | Meaning |
|---|---|
| `SELENIUM_UNREACHABLE_ERROR` / `SELENIUM_CONNECTION_ERROR` | No grid at `seleniumUrl`. Start one, or set `autoStartWebDriver: true` (Chrome only). |
| `CHROMEDRIVER_ERROR` | chromedriver failed to start, usually a browser/driver version mismatch. |
| `WEBDRIVER_ERROR` | Generic driver-level failure; read the original message. |
| `INVALID_CAPABILITIES` / `BROWSER_CONFIGURATION_ERROR` | Bad `capabilities` in the config — commonly a missing or misspelled `browserName`. |
| `URL_OPEN_ERROR` | The page could not be reached. Check the environment's `baseUrl` and whether the application is running. |
| `APPIUM_*` / `DEVICE_NOT_FOUND` | Mobile session problems — Appium server, device availability, app path. |
| `UNEXPECTED_ALERT_OPEN` | A native dialog blocked the command. Handle it with `web.alertAccept()` / `web.alertDismiss()` at the point it appears. |
| `FRAME_NOT_FOUND` | `selectFrame` could not find the frame; check for nested frames and whether it loaded. |

## Getting the run output in a usable shape

Run with `--rf=agent` and read `agent-report.json` from the output directory.
The HTML report is built for a person to browse; this one is built to be read
by whatever is fixing the test:

```bash
oxygen cases/login.js --rf=agent --ro=./reports
```

A passing run is a few hundred bytes. A failing one gives, per failure: the
error `type` and `message`, the failing `step`, the `location` as a
project-relative `file:line:column`, the `precedingSteps` that led up to it,
and `screenshot` / `snapshot` filenames sitting next to the report — the
snapshot being the actual page HTML at the moment of failure.

A failure with no `step` means the script threw before reaching a command;
`location` still points at the line.

## Reading the run output

Work from the step results, not just the final error:

1. **The failing step** — its `name` is the command, `location` is the script
   line, `failure.type` the code above.
2. **The step before it** — a failure very often originates one step earlier
   (an action that silently did nothing).
3. **The transaction** the failing step sits in — if transactions are named
   after manual test steps, this tells you which scenario step broke.
4. **The captured screenshot and page snapshot** on the failing step — these
   show actual page state at the moment of failure, and settle most
   locator-versus-application questions immediately.
5. **Earlier `VERIFY_ERROR` steps** — non-fatal, so an unrelated-looking later
   failure may be their consequence.

## Repair loop

When iterating toward a passing test:

1. Read the error code and classify: test defect or application bug.
2. If application bug — stop, report it. Do not modify the test.
3. If test defect — inspect actual page state (snapshot or screenshot) before
   editing. Never guess a replacement locator.
4. Make one change addressing one cause.
5. Re-run the single test, not the whole suite: `oxygen cases/login.js`.
6. Repeat.

Stop and ask for input when: the same failure survives three repair attempts;
the fix would weaken an assertion; results alternate between pass and fail
across identical runs (a flaky test is its own defect, and papering over it with
retries or waits hides it).

Two consecutive clean runs is the minimum bar for calling a test fixed — one
green run after a timing change proves very little.
