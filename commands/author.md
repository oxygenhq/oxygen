---
description: "Turn a manual test case into a working, verified Oxygen test"
---

# Author an Oxygen test from a manual test case

Load the `oxygen-author` skill and follow it. It orchestrates the other
Oxygen skills; read `oxygen-write` before writing any script.

The user's manual test case, acceptance criteria or described scenario is in
`$ARGUMENTS` — if that is empty, ask which case to automate before starting.

## The loop

1. **Look at the application before writing anything.** Open a session and walk
   the steps by hand:

   ```bash
   oxygen session start --env=dev --headless
   oxygen web snapshot                 # roles, names, refs, durable locators
   oxygen po                           # what this project already provides
   ```

   Reuse the project's page objects rather than retyping them. Pass project
   values as `po:Path`, `env:name`, and `secret:Path` for anything encrypted —
   never paste a credential into a command.

2. **Act through `ref=`, record the `locator` column.** Refs are valid only
   until the next snapshot and must never reach a test file.

3. **Emit the script**, either with `oxygen session save cases/<name>.js` or by
   hand following `oxygen-write`. Locators belong in `oxygen.po.js`.

4. **Run it from a clean browser** — not from the exploration session:

   ```bash
   oxygen cases/<name>.js --env=dev --headless --rf=agent --ro=./reports
   ```

5. **Repair and repeat** until it passes. Read `agent-report.json`, not the
   terminal scroll. `/oxygen:triage` covers reading a failure properly.

## Finish honestly

A test that passes once is weak evidence — a race can pass three times and fail
the fourth. Before declaring it done, run it twice from a clean browser.

If the application is genuinely broken, say so and stop. Do not weaken an
assertion to match what the application currently returns; that removes the
thing the test exists to check.
