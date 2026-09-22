---
description: "Create a new Oxygen project, or add the agent skills to an existing one"
---

# Set up an Oxygen project

Load the `oxygen-setup` skill for the layout and its reasoning.

## A new project

```bash
oxygen init <dir>
oxygen skills install        # commit what it writes, so a clone gets it too
```

`init` writes `oxygen.conf.js`, `oxygen.env.js`, `oxygen.po.js`, and an example
case and suite.

## An existing project

```bash
oxygen skills install        # or --agent=NAME for one assistant only
```

Install from the version of Oxygen you are running: the skills document this
CLI's own flags, so a set copied once goes stale and an agent will confidently
use a flag that no longer exists.

## The project notes file

Record in `CLAUDE.md` which environment is safe to run against and which account
the suite expects, creating the file if the project has none. That is the
context no skill can carry, and without it every agent rediscovers it.

## Layout that matters

- Locators live in `oxygen.po.js`, never inline in a case.
- Environments live in `oxygen.env.js`, selected with `--env=NAME`.
- Prefer an id or a test attribute over a positional path. `//div[3]/div/span[2]`
  breaks on any layout edit, and a framework upgrade breaks all of them at once.
- A project whose config predates `autoStartWebDriver` needs `--autowd=true` to
  run without a Selenium hub.
