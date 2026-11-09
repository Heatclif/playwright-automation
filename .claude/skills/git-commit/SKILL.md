---
name: git-commit
description: Write and make a git commit for this repo in the project's format, `[PW-xxxx] Summary` followed by a short bullet list of what changed (major change first, small points as sub-bullets). Use whenever the user asks to commit, "commit this", "commit my changes", write or suggest a commit message, or says they're done and want it saved to git, even if they don't mention the format or the skill. Commits locally only; never pushes.
---

# Git commit

Produces a commit whose message tells a reviewer, in a few lines, what the main change was and what else came along. Invoking this skill is the user's request to commit, so it satisfies `.ai_documentation/skill-shared-rules.md` section 4. That section still bans pushing: this skill never pushes.

## Message format

```
[PW-0008] Short summary of the main change

- Major change, one line
  - Small related point
  - Another small point
- Second major change, if there really is one
  - Small point
```

- **Subject**: `[PW-xxxx]` (4 digits, as in the history), a space, then a summary of the one main change, past tense like the existing commits ("Added...", "Removed...", "Fixed..."), about 70 characters, no trailing period.
- **Body**: a blank line, then bullets. Top-level bullets are the major changes, usually 1 to 3. Small things (renames, doc touch-ups, config tweaks, import fixes) go as `  -` sub-bullets under the major bullet they belong to, so the reader sees the headline first and can skip the detail.
- **Why so short**: the diff already has the detail. The message is for scanning history, so say what changed and, only when not obvious, why. One line per bullet. Name files or folders only when it helps (`regression.yml`, `.ai_documentation/`).
- A change with one purpose gets one top-level bullet. Don't pad to make it look thorough.
- End with the commit attribution line the session context asks for (the `Co-Authored-By` trailer), after a blank line.

Example (from this repo's history, expanded):

```
[PW-0005] Added AI analysis skill

- Added failure-analysis skill that renders Allure results as per-spec tables
  - sync script refreshes allure-report_combined from gh-pages
  - skips itself when running in GitHub Actions
- Added optional Claude analysis job to regression.yml
  - manual checkbox, off by default
```

## Steps

1. **Look at the state**: `git status --short`, `git diff --stat`, and the diff itself (`git diff HEAD`, plus read untracked files that will be included). Read enough to describe the change accurately; don't describe from file names alone.
2. **Decide what goes in the commit.**
   - If the user has staged files, commit exactly those. Mention anything unstaged that was left out.
   - If nothing is staged, stage the changed and new files that belong to the work. Skip anything that looks like a secret or generated output (`.env`, credentials, `allure-*` folders, `test-results/`, `node_modules/`) and tell the user if you skipped something. If the changes look like unrelated pieces of work, say so and offer to split them into separate commits rather than writing one vague message.
3. **Get the ticket number.** In order: one the user gave; one in the branch name (`git branch --show-current`); otherwise the next number after the latest `[PW-xxxx]` in `git log --format=%s`. If you had to infer it from the log, ask the user to confirm that one number before committing, since a wrong ticket in history is annoying to fix and only they know it.
4. **Write the message** in the format above, then commit with a heredoc so the formatting survives:
   ```bash
   git commit -F - <<'MSG'
   [PW-0008] ...

   - ...
   MSG
   ```
5. **Report**: the commit hash, the message as committed, and the files left uncommitted, if any.

## Guardrails

- Don't push, amend or rebase unless the user asks. Don't use `--no-verify`; if a hook fails, show the error and fix the cause or ask.
- Don't commit when there is nothing to commit; say so.
- If the framework changed but the matching `.ai_documentation/` file wasn't updated (CLAUDE.md requires it in the same change), point it out before committing and let the user decide.
