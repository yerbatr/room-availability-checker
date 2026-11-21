# Task #07 — Mitigation Records

## Mitigation 1 — Remove unused Supabase dependency (R2)

- **Original risk:** The package was declared although the app has no backend and no source reference was found.
- **Change:** Removed `@supabase/supabase-js` from `package.json` and its unused dependency subtree from `package-lock.json`.
- **Why minimal:** No application code or feature behavior required the package; no replacement dependency was added.
- **Verification:** `npm prune --ignore-scripts --offline` removed 15 extraneous packages and reported an audit summary of 0 vulnerabilities. Final tests/typecheck/lint/build are recorded in `final-verification.md`.
- **Observed behavior:** Development server started; requests for `/` and `/src/main.tsx` returned HTTP 200. This is a basic server smoke check, not full UI verification.
- **Residual risk:** A future planned Supabase integration would need to add the package back through review.

## Mitigation 2 — Manual UI evidence gate (R3)

- **Original risk:** No browser/UI automation script or DOM testing library is configured.
- **Change:** Updated `AGENTS.md` to require recording manual UI checks as executed/not executed with observed results and environment limitations. Added `ui-verification-guide.md` with reproducible inputs, expected observations, and a screenshot log.
- **Why minimal:** Uses the existing manual cases and requires truthful evidence without adding dependencies or replacing the test stack.
- **Verification:** Dev server returned HTTP 200 for the root and app module. The student supplied dated screenshots documenting prior available, conflict, blocked, invalid-time, invalid-request, and adapter-fallback UI states. These are historical evidence, not a new run. Git comparison confirms current app source matches `origin/main`; Task #07 changed no app source. See `evidence/` and `final-verification.md`. Interactive cases specific to this assignment (duration boundaries, endpoint touches, room switch refresh) were **not re-run** because browser control was unavailable.
- **Observed outcome:** Existing historical screenshots show prior manual UI states for availability, conflict, blocked room, invalid time/request, and adapter failure. Automated tests cover booking duration and interval endpoints; room-switch refresh remains without fresh UI evidence.
- **Residual risk:** The gate improves review practice but does not provide automated UI coverage. The supplied historical screenshots do not prove duration boundaries, endpoint touches, or room-switch refresh; those checks remain unverified for this assignment run.
