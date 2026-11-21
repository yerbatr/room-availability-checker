# Task #02 — Agent Instructions Review

The existing root `AGENTS.md` already documented the project purpose, architecture, commands, acceptance criteria, data constraints, forbidden integrations, and verification expectations. Task #02 therefore extends rather than replaces it.

Added an **Agent review gate** covering source inspection, minimal scoped edits, regression tests, dependency approval, protected/generated files, secrets, destructive/deployment actions, diff review, actual verification reporting, and approval before Git or external actions.

The existing text says not to introduce secrets, deploy, add dependencies without approval, edit `dist/` or `.bolt/`, or push without approval. The added gate makes the no-commit/no-merge condition and human review of the diff explicit. No application code or dependencies changed.

Verification for this documentation-only task: inspected the final diff; the four baseline checks from Task #01 remain the last executed code checks. No new test run was needed for this documentation edit.
