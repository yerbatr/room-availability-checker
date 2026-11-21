# AI Evidence Appendix

Date: 2026-11-21 to 2026-11-22. AI assistant: GPT-6, used in the Codex workspace.

This appendix records the actual Assignment #05 interactions in summarized form. The AI assistant used for this work was GPT-6. Earlier project screenshots were supplied as evidence; they are recorded as prior checks and are not presented as new runs.

| Action | My prompt or direction | GPT-6 response | Evidence and my decision | Files changed |
|---|---|---|---|---|
| Task 01 baseline | Inspect Smart Campus repo; read AGENTS/README; run checks; identify evidence-backed gaps; do not alter source/config. | Baseline map, check results, and candidate gaps. | Direct source/config inspection; actual commands: tests 132/132, typecheck/lint/build pass; baseline Git commit recorded. | `docs/assignment-05/baseline-report.md`, `repository-map.md` |
| Task 02 instructions | Asked to work through the assignment in order and improve the existing guide. | Added review/safety gate while keeping existing content. | The change is visible in the `AGENTS.md` diff. | `AGENTS.md`, `agent-instructions-review.md` |
| Task 03 pattern | Inspect current flow and decide whether one pattern/refactor is justified. | No new pattern; existing adapter is an appropriate boundary. | Read `checkFlow.ts`, `explanationAdapter.ts`, `App.tsx`, feature contract, and existing tests. | `pattern-decision.md` |
| Tasks 04–06 | Conduct read-only risk review, score risks, assess agent readiness. | Five candidates across categories; Level 2 readiness. | Cross-checked manifest, source search, config, and AGENTS; unverified security claim explicitly rejected. | `risk-review.md`, `risk-register.md`, `agent-readiness-audit.md` |
| Task 07 | Continue assignment, address top risks minimally, verify. | Removed unused Supabase package; strengthened manual evidence gate. | Diff review; npm prune offline; final test/typecheck/lint/build; HTTP 200 smoke check. Earlier project screenshots document several UI states but not all current manual checks. No new interaction run is claimed. | `package.json`, `package-lock.json`, `AGENTS.md`, mitigation/final verification records, `evidence/` screenshots |
| Tasks 08–10 | Complete safeguards, release decision, reflection, evidence appendix. | Hypothetical controls, CONDITIONAL release recommendation, reflection draft. | Derived only from recorded evidence; reflection marked for student review. | Task 08–10 documents |
| Earlier UI evidence | I supplied screenshots from prior checks of this project. | Relevant dated screenshots were copied into the assignment evidence folder. | GPT-6 inspected the images and captions; comparison with `origin/main` found no app-source diff. The screenshots are labeled as prior evidence, not new test runs. | Copies in `docs/assignment-05/evidence/` |

Prompts are summarized rather than quoted; this is an evidence summary, not a verbatim transcript. The interaction record shows that I asked GPT-6 to work through the full assignment and authorized the scoped repository changes. No commit, push, merge, or deployment was requested or performed.
