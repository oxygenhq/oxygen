---
name: oxygen-project-setup
description: Create or restructure an Oxygen test automation project — directory layout, oxygen.conf.js, environments, suites, page-object and data file organization. Use when starting a new Oxygen project, adding environments or suites to an existing one, or when asked where a test, page object, or data file should live.
user-invocable: true
---

# Oxygen project setup

Oxygen enforces very little structure. A handful of filenames are fixed by the
framework; everything else is convention. This skill separates the two, so you
never present a convention as a requirement — or break a real requirement
thinking it was a preference.

## Canonical layout

```
project/
  oxygen.conf.js          # FRAMEWORK: name fixed. Hooks load ONLY from .js
  oxygen.po.js            # FRAMEWORK: name fixed -> global `po`
  oxygen.env.js           # FRAMEWORK: name fixed -> { dev: {...}, prod: {...} }
  env/
    staging.json          # FRAMEWORK: alternative, one file per environment
  suites/
    smoke.json            # FRAMEWORK: auto-discovered, no registration needed
    regression.json
  modules/
    module-billing.js     # FRAMEWORK: default external module dir, name pattern fixed
  cases/
    login.js              # convention
    login.csv             # FRAMEWORK: auto-pairs with login.js by filename
    checkout.js
  po/
    loginPage.js          # convention: one file per page, re-exported by oxygen.po.js
    dashboardPage.js
  data/
    users.xlsx            # convention
  CLAUDE.md               # convention
```

Anything marked FRAMEWORK is resolved by name in Oxygen's own code and cannot be
renamed. Anything marked convention is our choice — follow it for consistency,
but say so plainly if a project already does something different, and match the
project rather than converting it unasked.

## Fixed filenames and how they resolve

**`oxygen.conf.js` or `oxygen.conf.json`** — the project config. Resolution
order for options, last wins: built-in defaults, then this file, then command
line arguments.

Critical: `hooks` are loaded **only** when the config is `oxygen.conf.js`. A
`.json` config silently has no hooks — no warning, they just never run. Always
prefer `.js`.

**`oxygen.po.js`** — the page object repository. Whatever it exports becomes the
global `po` object. Override the filename with `--po=FILE` if needed. This is the
entire mechanism; see the `oxygen-writing-tests` skill for how to structure what
it exports.

**`oxygen.env.js`** — environments, as a map of environment name to values:

```js
module.exports = {
    default: { baseUrl: 'https://dev.example.com', timeout: 30000 },
    staging: { baseUrl: 'https://staging.example.com', timeout: 60000 },
};
```

Selected with `--env=staging`; defaults to the `default` key. If this file does
not exist, Oxygen falls back to `env/<name>.js` then `env/<name>.json`. Use one
style or the other, not both.

Environment values are reachable two ways: as `env.baseUrl` in code, and as
`${baseUrl}` inside any string command argument.

**`suites/*.json`** — every `.json` file in this folder is discovered
automatically and merged with any `suites` array in the config. No registration.

```json
{
    "name": "smoke",
    "iterations": 1,
    "cases": [
        { "name": "login",    "path": "cases/login.js" },
        { "name": "checkout", "path": "cases/checkout.js", "iterations": 3 }
    ]
}
```

Recognized keys: `name`, `id`, `iterations` (or `iterationCount`),
`capabilities`, `parallel`, and `cases[]` with `name`, `path`, `iterations`.
Case paths resolve relative to the project root. A case with no `name` is named
after its filename.

**`modules/module-<name>.js`** — custom modules. The `module-` prefix is matched
by regex and the name between the prefix and `.js` becomes the global. Change the
folder with the `modules_ext` option.

## A minimal oxygen.conf.js

```js
module.exports = {
    name: 'My Test Project',

    // capabilities passed to WebDriver
    capabilities: {
        browserName: 'chrome',
    },

    // download and launch chromedriver automatically — no Selenium grid needed
    autoStartWebDriver: true,

    iterations: 1,
    reopenSession: false,

    reporting: {
        reporters: ['html'],
        outputDir: './reports',
    },

    // only these modules are loaded; omit to load all of them
    modules: ['web', 'utils', 'log', 'assert'],

    hooks: {
        beforeTest: () => { /* runs once before everything */ },
        beforeCase: () => { /* runs before each test case */ },
        afterCase:  () => { /* runs after each test case */ },
        afterTest:  () => { /* runs once at the end */ },
    },
};
```

Two settings worth setting deliberately:

- **`modules`** — every module listed is loaded and initialized at startup. The
  default loads all 19. Listing only what the project uses measurably cuts
  startup time and avoids loading modules with heavy native dependencies.
- **`autoStartWebDriver`** — Oxygen downloads and starts chromedriver itself.
  This works for **Chrome only**; other browsers still need a Selenium grid at
  `seleniumUrl`.

Available hooks: `beforeTest`, `beforeSuite`, `beforeCase`, `afterCase`,
`afterSuite`, `afterTest`, plus command-level hooks. Hooks are plain synchronous
functions.

## Deciding where something goes

**A new test case** — `cases/<feature>.js`. One user-facing scenario per file.
If a file needs more than one `web.init()`, it should have been two files.

**A locator** — `po/<page>.js`, never inline in a test. The one exception is a
locator used exactly once in exactly one test, where naming it adds nothing.

**Test data** — depends on how it varies:

| Data | Where |
|---|---|
| Varies per iteration (data-driven runs) | `cases/<test>.csv` — auto-pairs by filename |
| Shared fixture across tests | `data/*.json` or `data/*.xlsx`, read via `utils.readCsv` / `utils.readXlsx` |
| Varies per environment (URLs, timeouts) | `oxygen.env.js` |
| Secrets | `utils.encrypt` — never plaintext in any file |

Never put credentials in `oxygen.env.js`, a suite file, or a data file in
plaintext. See the `oxygen-writing-tests` skill for the encryption pattern.

**A reusable helper that is not page-specific** — a plain module under `lib/`
required normally. Only write a custom Oxygen module under `modules/` when you
need it to appear as a global with steps recorded in the report; that is a
heavier commitment than a helper function.

## Running it

```bash
oxygen .                          # whole project via oxygen.conf.js
oxygen cases/login.js             # one test file
oxygen . --suites=smoke           # named suites only
oxygen . --env=staging            # pick an environment
oxygen . -b firefox -s http://grid:4444/wd/hub
oxygen . --rf=html,junit --ro=./reports
oxygen cases/login.js -p data/users.xlsx --pm=all   # data-driven, one run per row
oxygen cases/login.js -d 1        # 1s delay between commands, for watching a run
```

`--pm` selects how parameter rows are read: `seq` (default), `random`, or `all`.
With `all`, iteration count becomes the number of rows and `-i` is ignored.

## Verifying the result

After scaffolding, confirm the project actually runs before reporting success:

```bash
oxygen . --suites=smoke
```

A project that has never been executed is not a finished project. If the run
cannot complete (no browser available, no target application), say so explicitly
rather than implying the setup was validated.
