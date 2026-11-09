---
name: review-framework-code
description: Review changes to this EventHub Playwright framework (specs, page objects, components, PageFactory, fixtures, tags, workflow files, skills) against the conventions in `.ai_documentation/`. Use whenever the user asks to review, check, audit or "look over" their changes, a diff, a branch, a PR, or specific spec/page-object files for this repo, or asks "does this follow our conventions / standards", even if they don't say "code review" or name the skill. Reports findings only; does not edit files unless asked.
---

# Review framework code

The framework's rules live in `.ai_documentation/`. This skill only runs the workflow and never restates the rules, so they can't drift.

**The review is done by a fresh subagent that knows nothing but which changes to look at.** You (the main session) usually know why the changes were made, and that knowledge biases a review toward "it's fine, I know what they meant". The subagent gets the diff and the project's documented conventions, nothing else, so its findings reflect what the code does and what the docs require.

## Step 1: Pick the scope

- User named files, a branch, or a PR -> review that (`git diff <base>...<branch>`, `gh pr diff <n>`, or the files).
- Otherwise review the working tree: `git status --short` lists changed and untracked files (new specs and page objects are untracked until added); `git diff HEAD` shows tracked changes.

Work out only two things: the **list of changed files** and the **command that shows the diff**. Don't read or summarise the changes yourself beyond that.

## Step 2: Spawn the reviewer

Start one subagent (`general-purpose`, so it can read files and run read-only git/grep) with a brief containing exactly:

```
Read .claude/skills/review-framework-code/references/reviewer-instructions.md and follow it.

Changes to review:
- Diff command: <command>
- Changed files: <list, marking which are untracked/new>
```

Keep the brief to that. Don't add the conversation, the user's goal, a description of what changed or why, earlier review findings, or your opinion of the code. Don't paste file contents. If the user asked for a particular focus (e.g. "check the tags"), you may add that one line, since it is part of the request, not the author's reasoning.

## Step 3: Report

Relay the subagent's report to the user in its own structure (severity groups, `path:line`, rule, fix). Before presenting, spot-check any MUST FIX by opening the cited line; drop or correct a finding that doesn't hold up, and say so. Don't soften or reword findings to fit what you know of the author's intent. If you disagree with one, say that separately and why.

## Step 4: Fixes (only on request)

Don't edit during the review. If the user asks you to fix findings, apply them, then rerun the affected tag. Follow `skill-shared-rules.md` sections 3 and 4: no weakening tests, no commits unless asked.
