# Merging `master` into `fix/agent-loop-friction`: read this first

**Expect a conflict in `src/core/OxygenCore.js`. That conflict is deliberate.**

This branch is based on `54a04e3`. Three upstream commits are not in it, one of
which — `ce73a67`, *"Fix continue on error option (change to
stopSuiteOnCaseFailure)"* — needs a decision rather than an automatic resolution.

## The two options are not the same feature

The commit message reads as a rename. It is not one. `ce73a67` **deletes** one
capability and **adds** a different one at another level:

| | Level | Question it answers | Where |
|---|---|---|---|
| `continueOnError` | step | after a command fails, do the *remaining steps of this case* run? | `core/OxygenCore.js` |
| `stopSuiteOnCaseFailure` | suite | after a case fails, do the *remaining cases of this suite* run? | `runners/oxygen/index.js` |

Neither substitutes for the other. Upstream removed step-level
continue-on-error and left no replacement for it.

## Why this branch needs the step-level option

`--rf=agent` exists so that one run tells an agent everything it needs to make a
round of repairs. When an application change breaks a script in several places,
`continueOnError` is what lets a single run report **every** broken step instead
of stopping at the first. Without it the repair loop degrades to one fix per run,
which is the cost this branch was written to remove.

## What this branch does about it

Both options are implemented here, at their own levels:

- `OxygenCore.js` keeps `if (error && error.isFatal && !this.opts.continueOnError)`,
  now with a comment stating why it must survive a merge.
- `runners/oxygen/index.js` carries `stopSuiteOnCaseFailure` implemented the same
  way `ce73a67` implements it (a labelled `caseLoop` and a `break`), so the branch
  is a superset of upstream rather than a divergence from it.
- Both are exposed on the CLI: `--continueOnError` and `--stopSuiteOnCaseFailure`.

**This branch deliberately edits the line `ce73a67` deletes.** That is the point.
Previously the branch did not touch `OxygenCore.js` at all, so a merge took
upstream's deletion cleanly, reported **zero conflicts**, and left
`--continueOnError` parsing fine while nothing read it — a silent no-op that
degraded runs back to stopping at the first failed command, with nothing failing
loudly to reveal it. A conflict git shows you is strictly better than that.

## Resolving it

Keep **both** sides:

1. In `OxygenCore.js`, keep this branch's version — the guard plus its comment.
   Taking upstream's version here is what reintroduces the silent no-op.
2. In `runners/oxygen/index.js`, either side is fine; the implementations match.
   If they have drifted, prefer upstream's and keep this branch's comment.

Then check both still work:

```bash
npm run build
node build/lib/cli.js --help | grep -E 'continueOnError|stopSuiteOnCaseFailure'
```

A suite with a deliberately broken early step should, with
`--continueOnError=true`, still report the later failures rather than only the
first.
