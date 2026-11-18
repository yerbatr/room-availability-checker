# Test Results — Task 05 (Normal and Failure Cases)

Date: 2026-11-18
Runner: Vitest (the only test framework in this project).
Automated results below come from `npm test` (118 tests, all passing). Nothing here is simulated: every "Observed" entry is the assertion outcome of a real test run.

## Scope of evidence

- **Automated:** all cases in the table below are covered by `src/lib/scenarios.test.ts` plus the existing suites (`bookingRules.test.ts`, `explanationAdapter.test.ts`, `roomFilters.test.ts`, `rooms.test.ts`).
- **Manual UI verification:** this environment has no browser or screenshot tooling, so no rendered-UI test and no screenshot could be produced by automation. The UI cases are listed under "Manual UI verification" below with the exact steps; they have NOT been performed and carry no PASS status.
- **No real LLM, external API, API key, backend, or network call is involved anywhere.** The explanation adapter is a mock; timeout and failure are simulated with fake timers and rejected promises.

## Test results table — automated

| # | Test case | Expected result | Observed result | Status |
|---|-----------|-----------------|-----------------|--------|
| N1 | Available room — valid interval, no conflict (10:30–11:00 on Lecture Theatre 101) | Status `available`; message contains room name, 10:30, 11:00 | Message: "Lecture Theatre 101 is free from 10:30 to 11:00 — you're good to go!" | PASS |
| N2 | Overlapping booking — request 09:00–09:30 overlapping CS301 (08:00–10:00) | Status `unavailable`; message names the conflicting booking and its interval | Message names "CS301 Algorithms" with 08:00 – 10:00 | PASS |
| N2b | Endpoint-touching interval (ends exactly 08:00 or starts exactly 10:00) | NOT a conflict; status `available` | Both variants returned `available` | PASS |
| N3 | Blocked room — LAB3 requested in a free interval | Status `unavailable`; message includes the blocked reason | Message includes "Under scheduled maintenance until further notice" | PASS |
| N4 | Invalid time — start "25:00", malformed start, end before start | Rejected with field errors; no availability check runs | Start-field error for out-of-range and malformed input; end-field error "End time must be after start time." | PASS |
| N5 | Past time — start 08:30 (equal to CURRENT_TIME) and 08:00 (before) | Rejected with "Start time must be after the current time (08:30)." | Both rejected with that exact message; 08:31 start validates cleanly | PASS |
| F1 | Empty input — adapter called with `{}` | Reason `UNKNOWN`; generic explanation; no invented facts (no "undefined"/"NaN") | Exact fallback explanation returned: "No explanation is available for this result. The availability status shown above is authoritative." | PASS |
| F1b | Incomplete structured input — conflict present but empty (`{ conflict: {} }`) | Generic conflict explanation without invented label or times | "…overlaps an existing booking. Try choosing a different time." Reason `BOOKING_CONFLICT` | PASS |
| F2 | Long input — 10,000-character room name, blocked reason, and conflict label | No crash; explanation built safely; no "undefined"/"NaN" | All three long strings handled; reason codes correct; long label reproduced verbatim | PASS |
| F2b | Junk types in text fields (numeric roomName, numeric conflict label, NaN times, null blockedReason) | No crash; junk ignored or omitted | Explanation built without "undefined"/"NaN" | PASS |
| F3 | Timeout — adapter promise that never settles, raced against a 2s guard (fake timers) | Pending promise loses the race; timeout detected; fallback message shown | Race resolved with `{ timedOut: true }`; fallback message contains "temporarily unavailable" and "remains accurate" | PASS |
| F4 | Simulated API failure — adapter promise rejects | Rejection caught; fallback message shown; original deterministic result unchanged | Fallback message surfaced; result still `available` with original message | PASS |
| D1 | Decision integrity — every prompt variant (A/B/C) as system instruction | Status and reason code pass through unchanged for both `available` and `unavailable` inputs | `systemInstruction` equals each variant; `status` and `reasonCode` unchanged in all 6 combinations | PASS |
| D2 | Decision integrity — adapter cannot flip availability | Re-evaluating after generating an explanation yields identical results; explanation never contradicts the status | `evaluateAvailability` returns deep-equal results before/after; available explanation contains no "unavailable" | PASS |
| D3 | `classifyReason` purity | Pure function of input; prompt text is never an input | Same input → same code; mutating input changes code accordingly | PASS |
| D4 | Rule purity / data integrity | `evaluateAvailability` never mutates the room or its bookings | `structuredClone` snapshots equal after checks, including all 5 catalog rooms | PASS |

Counts: 16 scenario assertions-groups in this table; total suite 118 tests, 0 failures.

## Deterministic decision integrity (summary)

- The only code path that decides availability is `evaluateAvailability` in `src/lib/bookingRules.ts`, called by `src/App.tsx` from the selected room and parsed times. The result is derived per render, not stored, so no adapter can persist a change to it.
- The adapter receives `status` as data (`ExplanationInput.status`), classifies a reason code from it, and formats text. No adapter export can alter the status. Verified by D1–D3 above.
- On adapter failure or timeout, `App.tsx`'s handler catches the rejection and shows `EXPLANATION_FALLBACK_MESSAGE` while the availability banner (`outcome`) remains rendered, because the banner is derived independently of explanation state. The catch path is exercised by F4; the pending-promise case by F3.
- The timeout/failure simulations are mock-level (fake timers, rejected/never-settling promises) because the app must run with no network at all. They exercise the same contract a real timeout would.

## Manual UI verification — performed by the user (2026-11-18)

All five manual cases M1–M5 were executed in a running browser by the user and reported as passing.

| # | Manual case | Steps | Expected | Reported status |
|---|-------------|-------|----------|-----------------|
| M1 | Available room | Select "Lecture Theatre 101", start 10:30, end 11:00, Check | Green banner "…you're good to go!", timeline highlights the slot | PASS (manually verified by user) |
| M2 | Booking conflict | Same room, start 09:00, end 09:30, Check | Red banner naming CS301 Algorithms 08:00 – 10:00 | PASS (manually verified by user) |
| M3 | Blocked room | Select "Computer Lab 3 (Blocked)", any valid interval, Check | Red banner with the maintenance reason; Blocked chip on the room card | PASS (manually verified by user) |
| M4 | Invalid/past time | Start 08:00 (past) or 25:00 (invalid), Check | Field error under Start Time | PASS (manually verified by user) |
| M5 | Explanation failure/fallback | Run a successful check, then force the adapter to reject and click "Explain Availability" | Amber fallback box with the fallback message; availability banner still visible | PASS (manually verified by user) |

Screenshot evidence: the temporary development-only failure-simulation toggle that supported M5 has been removed after verification. No screenshot files are present in the project — none were saved to the repository, so none are available as archived artifacts.

## Verification commands (actual results, 2026-11-18)

| Command | Result |
|---|---|
| `npm test` | 5 files, 118 tests passed, 0 failed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | built successfully (dist emitted), exit 0 |

## Remaining limitations

- No jsdom/React Testing Library is installed, so UI rendering is not covered by automation; installing would require dependency approval.
- The timeout case simulates a never-settling promise rather than a real network timeout — the app has no network layer by design (AC6).
- Screenshot files for M1–M5 are not present in the project; the manual verification is recorded by the user's report, not by archived images.
