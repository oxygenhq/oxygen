---
description: "Diagnose a failed Oxygen run and decide test defect or application bug"
---

# Triage a failed Oxygen run

Load the `oxygen-triage` skill and follow it.

If a report already exists, read it. Otherwise re-run the failing target with
output shaped for this:

```bash
oxygen <target> --env=dev --headless --rf=agent --ro=./reports
```

`agent-report.json` gives the error type and message, the failing step, its
script line, the steps leading up to it, and the page snapshot copied alongside.
Read the snapshot before theorising: it is the page as it actually was.

## Read these fields first

- **`alsoAppearsIn`** — every other `file:line` using the locator that failed.
  A locator broken by an application change is almost never broken in one file.
  Decide the fix once, then apply it to every line listed, or the next run
  rediscovers the same fault in the next file.
- **`hint`** — present when the script called a command that does not exist.
  Trust it over memory of the API; it is resolved from the generated catalogue.

## When a script looks broken in several places

```bash
oxygen <target> --env=dev --headless --continueOnError=true --timeout=8 --rf=agent
```

Every failed step is then reported instead of only the first. Two cautions:
read the failures in order, because later ones are often consequences of an
earlier one; and set `--timeout` deliberately — too low manufactures failures
from slow elements, too high makes the run crawl at every broken locator.

Count the *first* failure per case, not the total. One broken step cascades, and
a raw failure count overstates the work by an order of magnitude.

## Classify before repairing

Separate a **test defect** (locator, wait, stale expectation) from an
**application bug** and from **missing test data** (a dead account, a deleted
fixture). Only the first is yours to fix. For the other two, report precisely
what you checked and stop — changing an assertion to match whatever the
application now returns destroys the test.
