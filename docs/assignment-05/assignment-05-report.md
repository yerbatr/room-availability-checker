# Software Engineering — Assignment #05

**Student:** Nursultan Yerbatyr  
**AI assistant:** GPT-6  
**Project:** Smart Campus Room Availability Checker  
**Report date:** 22 November 2026

## 1. Project overview

The project is a React and TypeScript single-page prototype for checking room availability. Room and booking data are fictional and stored in the client. The app has no backend, database, login, or booking creation.

| Area | Project files |
|---|---|
| App entry and main UI | `src/main.tsx`, `src/App.tsx` |
| Availability rules | `src/lib/bookingRules.ts` |
| Room filters | `src/lib/roomFilters.ts` |
| Explanation flow | `src/lib/checkFlow.ts`, `src/lib/explanationAdapter.ts`, `src/lib/explanationPrompts.ts` |
| Room data | `src/data/rooms.ts` |
| Verification | Vitest tests under `src/`; scripts in `package.json` |
| Repository guidance | `README.md`, `AGENTS.md` |

The detailed map is in [repository-map.md](repository-map.md). The existing acceptance criteria are summarized in the baseline report.

## 2. Scope and working approach

I asked an AI assistant, GPT-6, to help me complete Assignment #05 one task at a time. I provided the repository location, the assignment PDF, and my project notes. I asked it to inspect the repository, keep the app intact, run the existing checks, document risks, and avoid commits or changes outside the assignment. I then asked it to continue through Tasks #01–#10.

The repository instructions kept the project within its original scope. No application behavior or room data was changed. The only non-documentation change was removing an unused Supabase package after confirming there were no source references and that the project guidance ruled out a backend.

## 3. Baseline checks

The baseline commit was `6f2bec94aa996e0d4f4d108d99fd203ecc20deae`. Git reported `main` ahead of `origin/main` by four commits with a clean working tree at baseline. No baseline commit was created.

| Command | Baseline result |
|---|---|
| `npm test` | 6 files passed; 132 tests passed. |
| `npm run typecheck` | Passed with no diagnostics. |
| `npm run lint` | Passed with no diagnostics. |
| `npm run build` | Passed; 1,580 modules transformed. |

Exact outputs and warnings are in [baseline-report.md](baseline-report.md).

## 4. Design decision and risk review

The app already separates deterministic booking rules from explanation text. I kept that design instead of adding another pattern. The explanation adapter formats a result; `bookingRules.ts` remains the source of truth. See [pattern-decision.md](pattern-decision.md).

The risk review identified a fixed 08:30 clock, an unused Supabase dependency, no automated browser/UI test script, disabled unused-symbol checks, and unverified security concerns. The first four observations are supported by source or configuration. No confirmed vulnerability was found; `npm prune` later reported zero known vulnerabilities for the pruned dependency tree, and no separate secret scan was performed. Full classifications and scores are in [risk-review.md](risk-review.md) and [risk-register.md](risk-register.md).

## 5. Changes made

1. I extended `AGENTS.md` with review expectations, safety boundaries, and a requirement to record whether manual UI cases were actually run.
2. I removed `@supabase/supabase-js` and its unused lockfile entries. Source search showed no imports, and the project has no backend.
3. I added a UI verification guide with exact inputs, expected outcomes, and an evidence log.
4. I created the task reports and collected relevant prior screenshots in `evidence/`.

No app source files, room data, or runtime behavior were changed. The [mitigation record](mitigation-records.md) explains the two selected risk controls and their remaining limits.

## 6. Final verification

After the package cleanup, the same four checks passed again: 132 tests, typecheck, lint, and build. The build emitted a warning that the local Browserslist data was outdated; I left it unchanged. The development server also returned HTTP 200 for `/` and `/src/main.tsx`.

Earlier screenshots supplied for this project show available, conflict, blocked-room, invalid-input, and explanation-fallback states. They are labeled as prior evidence in the appendix. They do not show every interaction from the current manual checklist. In particular, duration boundaries, endpoint-touch UI behavior, and changing rooms after a check were not rerun for this assignment.

## 7. Agent readiness and release decision

I rated the repository **Level 2 — Documented**. It has a clear module structure, lockfile, tests, lint/typecheck/build commands, and repository guidance. I did not collect clean-install evidence, and the project has no automated UI tests. These gaps are detailed in [agent-readiness-audit.md](agent-readiness-audit.md).

**Release decision: CONDITIONAL.** The automated checks pass, but the remaining UI evidence and lack of browser automation should be considered before treating the app as ready for broader use. The control and owner are documented in [release-decision.md](release-decision.md).

## 8. Reflection

The 200–300 word reflection is in [ai-reflection.md](ai-reflection.md). It describes how I used GPT-6, which suggestions I kept, and what I checked, including the limits of the UI evidence.

## 9. AI use and evidence

The [AI evidence appendix](ai-evidence-appendix.md) records my prompts and decisions in summary form. Screenshots and the earlier test capture are kept under [`evidence/`](evidence/). The source summary identifies which checks they support and which remain unverified.

## 10. Repository status

No commit, push, merge, or deployment was performed. The branch remains `main`, four commits ahead of `origin/main`; assignment files are uncommitted. The final checklist is in [final-checklist.md](final-checklist.md).
