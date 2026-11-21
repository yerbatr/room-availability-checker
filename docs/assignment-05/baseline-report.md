# Assignment #05 — Task #01 Baseline Report

Date: 2026-11-21

## Repository state

- Repository: `C:\Users\erbat\Desktop\uni\soft\room-availability-checker`
- Baseline commit: `6f2bec94aa996e0d4f4d108d99fd203ecc20deae`
- Git status: `main...origin/main [ahead 4]`; no working-tree changes were reported.
- Existing `dist/` and `node_modules/` directories were present. Per `AGENTS.md`, `dist/` is not to be edited.

## Checks executed

| Exact command | Result |
| --- | --- |
| `npm test` | PASS — 6 test files, 132 tests. Vitest 2.1.9; 3.04 s duration. |
| `npm run typecheck` | PASS — `tsc --noEmit -p tsconfig.app.json`, no diagnostics. |
| `npm run lint` | PASS — `eslint .`, no diagnostics. |
| `npm run build` | PASS — Vite 5.4.8 transformed 1,580 modules and built production assets in 5.03 s. |

No warnings or errors appeared in the captured outputs. Development server was not started because the one-shot verification commands sufficed for baseline; the assignment says run it only if appropriate. No UI/browser run was performed.

## Evidence-backed weaknesses / gaps

1. **Fixed clock:** `src/App.tsx` defines `CURRENT_TIME = 8 * 60 + 30` and uses it for availability validation and display. This is confirmed behavior; whether it is a weakness depends on the prototype requirement to use real time.
2. **No automated UI/browser check among project scripts:** `package.json` provides Vitest, lint, typecheck, and build scripts, but no browser/UI test script. The six existing test files are logic/data tests. `AGENTS.md` names manual UI cases, but no manual UI execution was recorded in this baseline. Confirmed coverage gap in current scripts; practical impact depends on expected UI assurance.
3. **Declared dependency not referenced in source:** `package.json` lists `@supabase/supabase-js`; repository source search found no Supabase import/reference. `AGENTS.md` describes no backend/database. Confirmed manifest/source mismatch; remove only if dependency intent is verified.

## Facts, assumptions, and suggestions

- **Observed facts:** paths, scripts, Git state, fixed 08:30 value, declared Supabase package, test file count, and command outcomes above were inspected directly.
- **Assumptions:** the fixed clock may be intentional for a static teaching prototype; the unused package may be starter residue.
- **Unverified suggestions:** decide whether current time should be dynamic, whether browser/UI automation is in scope, and whether the Supabase dependency should be removed. No such changes were made in Task #01.

## Preservation

Baseline commit and clean working tree are recorded above. No commit was created. Later work should retain this commit as the comparison point; the branch is already four commits ahead of its remote tracking branch.
