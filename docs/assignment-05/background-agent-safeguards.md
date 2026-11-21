# Task #08 — Background Agent Safeguards

## Hypothetical task

Add a regression test for one confirmed booking-rule edge case without changing application behavior.

## Isolation and boundaries

- Use a dedicated branch/worktree based on the recorded baseline commit; never share a writable checkout with another agent.
- Allowed files: one relevant `src/lib/*.test.ts` and, only if required, its matching pure rule module. Forbidden: `.env*`, secrets, `dist/`, `.bolt/`, lockfiles, deployment config, room catalog, unrelated UI files, and files outside the repository.
- Allowed commands: inspect files, `npm test -- <target>`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff`, `git status`.
- Forbidden: destructive cleanup/reset, dependency installation/update, network calls, publishing, deployment, credential inspection, commit/push/merge.
- Time limit: 30 minutes; one behavior and at most two source/test files. Stop and report if blocked or scope expands.

## Required handoff and approval

Return a change summary, full diff, test logs, build result, and residual-risk notes. Human reviewer checks scope and diff, independently runs checks, and explicitly approves any protected-file change or scope expansion. No merge/push/deployment without separate approval.

On failure, stop edits and return logs and current status. Preserve partial work in the isolated branch; do not reset or discard it. Human decides whether to amend or abandon. Resolve conflicts only after the owner reviews both versions; do not silently choose one. Rollback means reverting the isolated branch/worktree after review, not destructive changes to the main checkout.
