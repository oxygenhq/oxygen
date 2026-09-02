---
description: "Run an Oxygen test, suite or project with the right flags"
---

# Run an Oxygen test

`$ARGUMENTS` is the target — a case file, a project folder, or an
`oxygen.conf.js`. With no target, run the project in the working directory.

```bash
oxygen <target> --env=dev --headless --rf=agent --ro=./reports
```

## First, make sure there is an `oxygen` to run

Do not assume the command exists - plenty of Oxygen projects have no `package.json`
at all, and a global install is per-machine. Try `npx oxygen --version`, then
`./node_modules/.bin/oxygen --version`, then `oxygen --version`, and use whichever
answers. If none do, `npm i --save-dev oxygen-cli` installs it and creates
`package.json` in the same step. A bare `npm i` is not the fix and fails outright
when there is no manifest.

## The flags that matter, and why

- **`--headless`** for anything unattended. A visible browser takes keyboard
  focus every time it opens, which makes the machine unusable during a run.
- **`--rf=agent`** whenever the output will be read rather than watched. It
  writes `agent-report.json`: the verdict, and for each failure the error, the
  script line, the steps leading up to it and the page snapshot alongside. A
  passing run is a few hundred bytes; `--rf=html,agent` keeps both.
- **`--env=NAME`** selects a block from `oxygen.env.js`. Without it the
  `default` block is used, which is rarely the one you meant.
- **`--autowd=true`** starts a matching browser driver instead of expecting a
  Selenium hub. A project whose config predates `autoStartWebDriver` needs it.
  The driver is cached under the user profile, so on a locked-down machine this
  fails with `EPERM`/`EACCES` naming that path, before any browser starts. That
  is a permission problem, not a driver one: add
  **`--wdcache=<writable path>`** rather than giving up on `--autowd`.
- **`--suites=NAME`** narrows a large project to one suite.

## When a script is broken in several places

```bash
oxygen <target> --env=dev --headless --continueOnError=true --timeout=8 --rf=agent
```

Every failed step is reported instead of only the first, which turns one browser
run into the whole picture. Set `--timeout` deliberately: too low manufactures
failures out of slow elements, too high makes the run crawl at every broken
locator. Read the failures in order — later ones are often consequences of the
first.

## After it finishes

Read `agent-report.json`, not the terminal scroll. If anything failed, hand off
to `/oxygen:triage` rather than guessing at a fix: it classifies test defect
versus application bug versus missing test data, and only the first is yours to
change.

Report the result honestly. If tests failed, say so and show the failures; a run
that was cut short is not a passing run.
