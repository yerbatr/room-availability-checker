# Agentic Code Review — Smart Campus Room Availability Checker

Date: 2026-11-18
Mode: Independent, read-only AI code review. No source files, tests, dependencies, configuration, or existing documentation were modified. The only file created is this report.

## 1. Scope and Methodology

### Documents read for context

- `README.md` — features, booking rules, project structure.
- `AGENTS.md` — architecture boundaries, acceptance criteria AC1–AC6, guardrails.
- `docs/feature-contract.md` — Explain Availability contract, AC1–AC8 (feature-level), adapter constraints, prompt comparison.
- `docs/risk-register.md` and `docs/test-results.md` — reviewed for context on known risks and verification status.

### Source files inspected

- `src/App.tsx` (full)
- `src/lib/bookingRules.ts` (full)
- `src/lib/roomFilters.ts` (full)
- `src/lib/explanationAdapter.ts` (full)
- `src/lib/explanationPrompts.ts` (full)
- `src/data/rooms.ts` (full)
- `src/components/DayTimeline.tsx`, `RoomFilters.tsx`, `ResultBanner.tsx`, `FieldError.tsx`, `EmptyState.tsx`, `formStyles.ts` (full)
- `src/lib/explanationAdapter.test.ts` (full)

### Git changes reviewed

This workspace is not a git repository and has no `origin/main` remote (`git rev-parse --is-inside-work-tree` fails; the review environment blocks git operations). Therefore `git diff origin/main...HEAD` could not be produced. The review covers the **entire working tree** as it stands. No committed-but-unpublished changes exist to diff against.

### Method

- Read all rule, adapter, data, and UI code end to end; traced data flow from input events through validation, availability evaluation, explanation generation, and rendering.
- Checked each acceptance criterion (AC1–AC6 in `AGENTS.md`, AC1–AC8 in `docs/feature-contract.md`) against the code paths that implement it, including reachability from the UI.
- Swept for the security checklist items applicable to a client-only app with no backend: DOM injection sinks, unsafe HTML, URL/redirect handling, `postMessage`, storage of untrusted input, injection through rendered strings. No server code, no Supabase, no network calls exist in this project.
- Ran nothing that mutates state; no commands were needed beyond reading, since the review is static.

## 2. Findings

### Category: Correctness

#### C-1 — "Explain Availability" button is unreachable after a failed validation, contradicting the feature contract

- **ID:** C-1
- **Title:** Invalid requests never show the Explain Availability button
- **Category:** Correctness
- **Severity:** Medium
- **Evidence:**
  - `src/App.tsx` lines 138–141:
    ```ts
    function handleCheck() {
      const newErrors = validateBookingRequest(...);
      setErrors(newErrors);
      setChecked(newErrors.length === 0);   // checked is false when validation failed
      clearExplanation();
    }
    ```
  - `src/App.tsx` lines 51 and 143–145:
    ```ts
    const hasValidationErrors = checked && errors.length > 0;   // always false
    function canExplain(): boolean {
      return checked && (outcome !== null || hasValidationErrors);
    }
    ```
  - Contract: `docs/feature-contract.md` section 8 — "The UI (`src/App.tsx`) shows an 'Explain Availability' button after a check runs — **including when validation failed**."
- **Explanation:** `setChecked(newErrors.length === 0)` means `checked` is `false` whenever validation produced errors. Consequently `hasValidationErrors = checked && errors.length > 0` is always `false`, and `canExplain()` returns `false` for every invalid request. The INVALID_REQUEST explanation path (adapter AC4, reason code `INVALID_REQUEST`) can never be triggered from the UI — it is only reachable in unit tests. The button gate contradicts the documented contract behavior.
- **Verification steps:**
  1. Run the app. Leave Start Time empty and click "Check Availability".
  2. The field error appears, but no "Explain Availability" button is rendered (because `canExplain()` is false).
  3. Code confirmation: with any validation failure, `checked === false`, so `hasValidationErrors === false` and `canExplain() === false`.
- **Recommendation:** Track "a check was attempted" separately from "validation passed" — e.g. set a `checked` flag unconditionally on Check click and derive `hasValidationErrors` from `checked && errors.length > 0` — so the button appears after any check, valid or invalid, as the contract specifies. (Leave for Task #07; do not fix in this review.)

#### C-2 — Stale explanation can overwrite state after inputs change mid-flight

- **ID:** C-2
- **Title:** In-flight explanation resolves after clearExplanation, restoring a stale result
- **Category:** Correctness
- **Severity:** Low
- **Evidence:** `src/App.tsx` lines 88–100 (`handleExplain` awaits `generateExplanation`, which resolves after a simulated 250 ms delay per `src/lib/explanationAdapter.ts` lines 62, 154–167, then calls `setExplanation(result)` unconditionally) versus `clearExplanation()` calls in the change handlers at lines 102–105, 117, 208, 232, 244, 249.
- **Explanation:** Every input change calls `clearExplanation()`, but nothing cancels or ignores an in-flight `handleExplain` promise. If the user clicks "Explain Availability" and then changes the room or a time within the adapter's simulated delay, the late-resolving promise writes the explanation for the previous input back into state. The displayed explanation then describes a room/interval that is no longer selected, and it cites a status that may no longer match the (re-derived) availability banner.
- **Verification steps:**
  1. Select a room, enter a valid interval, click "Check Availability".
  2. Click "Explain Availability" and, within ~250 ms, change the room in the dropdown.
  3. The explanation area repopulates with the previous room's explanation even though the selection and results were cleared.
- **Recommendation:** Guard the resolution — capture the inputs used for the request and, on resolution, apply the result only if the current selection still matches (or use an incrementing request token / cleanup flag). Display-only impact; the deterministic availability banner is unaffected.

#### C-3 — `timeToMinutes` accepts `24:00` for the start field while the browser input cannot produce it

- **ID:** C-3
- **Title:** Asymmetric handling of the 24:00 boundary between parser and input control
- **Category:** Correctness
- **Severity:** Low
- **Evidence:** `src/lib/bookingRules.ts` lines 50–66 (regex `[01]\d|2[0-4]` explicitly allows `24:00` and rejects `24:01`), lines 106–118 (range check `startMins > MINUTES_PER_DAY` admits 1440), and `src/App.tsx` lines 229–253 (`<input type="time">`, whose value space ends at `23:59` in browsers).
- **Explanation:** The rule layer deliberately supports `24:00` (documented in AC1 as "within 0–1440 minutes"), but the only producer of time strings is an HTML time input that cannot emit `24:00`. The path is therefore dead in practice and its behavior is only observable if `timeToMinutes` is fed strings programmatically. Not a user-visible defect today; flagged because the contract's "0–1440" range and the UI's actual "00:00–23:59" range silently differ, and a future input change (e.g. a text field) would expose the discrepancy.
- **Verification steps:**
  1. In the UI, no time entry can produce a start of `24:00` (the picker caps at 23:59).
  2. In a test console, `timeToMinutes('24:00')` returns `1440` while `timeToMinutes('24:01')` throws — the boundary exists in rules but is unreachable from the UI.
- **Recommendation:** Either document that the UI effectively limits requests to 23:59 (keeping `24:00` support in the pure rules layer for contract completeness) or align the two. No behavior change required for AC1–AC6.

### Category: Security

**No confirmed findings.** Explicitly checked, all clean:

- No `dangerouslySetInnerHTML`, no raw DOM injection, no `eval`/`new Function`; all rendered strings (room names, booking labels, blocked reasons, validation messages, explanations) go through React's escaping. The fictional data in `src/data/rooms.ts` is the only content source.
- No network calls, no external APIs, no API keys or secrets (`explanationAdapter.ts` uses only `setTimeout`), satisfying feature-contract AC6.
- No URL/redirect handling, no `postMessage`, no `localStorage`/`sessionStorage`, no cookie access.
- `parseAttendees` (`src/lib/roomFilters.ts` lines 25–37) rejects non-integer and sub-1 input; `Number()` coercion cannot reach any dangerous sink — the value is only compared against room capacity.
- No backend, no authentication, no data exposure surface exists.

### Category: Code Quality

#### Q-1 — Overlap predicate duplicated outside the single source of truth

- **ID:** Q-1
- **Title:** App.tsx re-implements the overlap rule that bookingRules.ts owns
- **Category:** Code Quality
- **Severity:** Low
- **Evidence:** `src/App.tsx` lines 57–60:
  ```ts
  return room.bookings.find(b => start < b.end && end > b.start);
  ```
  versus `src/lib/bookingRules.ts` lines 68–70:
  ```ts
  return start < booking.end && end > booking.start;
  ```
- **Explanation:** The overlap predicate is the core booking rule (AC4) and `bookingRules.ts` already exports `overlaps()` and `findConflict()`. `App.tsx` re-implements it inline in `findConflictBooking` solely to build the explanation input. If the rule ever changes (e.g. endpoint-touching semantics), the explanation layer could disagree with the deterministic banner without any test failing on the rule module. This weakens the "single source of truth" boundary that `AGENTS.md` and the feature contract establish.
- **Verification steps:**
  1. Grep the repository for `b.start` / `b.end` comparisons: the predicate appears in both files.
  2. Note that `App.tsx` imports from `bookingRules` but not `overlaps`/`findConflict`.
- **Recommendation:** Import and reuse `findConflict(range, room.bookings)` from `bookingRules.ts` in `buildExplanationInput`. Behavior-identical; removes the duplicate. (Task #07 candidate.)

#### Q-2 — Commented-out dead code left in bookingRules.ts

- **ID:** Q-2
- **Title:** Orphaned previous implementation of timeToMinutes
- **Category:** Code Quality
- **Severity:** Low
- **Evidence:** `src/lib/bookingRules.ts` lines 45–48:
  ```ts
  // export function timeToMinutes(time: string): number {
  //   const [h, m] = time.split(':').map(Number);
  //   return h * 60 + m;
  // }
  ```
- **Explanation:** The commented block is the older, weaker parser (no format validation, `NaN` on malformed input) superseded by the regex-based implementation at lines 50–66. Keeping it invites accidental restoration and contradicts the "leave the tree clean" convention. Purely cosmetic; no behavioral impact.
- **Verification steps:** Read lines 45–48 of `src/lib/bookingRules.ts`.
- **Recommendation:** Delete the commented block. (Task #07 candidate.)

### Category: Performance

**No confirmed findings at defect severity.** Two observations recorded as non-defects, so the category is not silently empty:

- `filterRooms` over the 5-room catalog runs once per render and once more inside `applyFilters` before the state update (`src/App.tsx` lines 42, 111–115). With a static catalog of five rooms this is negligible; at catalog sizes orders of magnitude larger it would justify memoization. Not a defect at current scale.
- Every keystroke re-renders the whole two-panel layout. Appropriate for a single-screen prototype; component splitting would be premature.

## 3. Severity Assessment

| ID | Category | Severity | Summary |
|----|----------|----------|---------|
| C-1 | Correctness | Medium | Explain button never appears for invalid requests; contract behavior unreachable from UI |
| C-2 | Correctness | Low | In-flight explanation can restore stale state after inputs change |
| C-3 | Correctness | Low | 24:00 boundary supported in rules but unreachable from the time input |
| Q-1 | Code Quality | Low | Overlap predicate duplicated in App.tsx, outside bookingRules.ts |
| Q-2 | Code Quality | Low | Commented-out dead code in bookingRules.ts |
| — | Security | None | No confirmed findings |
| — | Performance | None | No confirmed findings at defect severity |

No Critical or High findings. The core deterministic engine (`bookingRules.ts`) is pure, correct against AC1–AC5, well-tested, and untouched by the explanation feature; the adapter never computes availability (feature AC5 holds — it only classifies and formats the status it is given).

## 4. Summary of Risks

The main risk is contractual, not functional: C-1 means a documented user-visible behavior (explanations for invalid requests) exists in the adapter and its tests but cannot be reached in the running app, so the feature contract and the UI have drifted. C-2 is a transient display inconsistency with no impact on availability decisions. Q-1 is a maintainability risk to the single-source-of-truth boundary; Q-2 and C-3 are hygiene items. None of the findings affect the correctness of the deterministic availability banner, modify booking rules, or introduce security exposure.

## 5. Overall Assessment: CONDITIONAL PASS

The deterministic core, data integrity (AC5), purity constraints, and security posture are sound, and the explanation adapter respects its subordination to the checker. The project passes on all hard constraints but is conditional on addressing C-1 (and ideally Q-1, C-2) in Task #07, since C-1 leaves a documented feature behavior unreachable in the UI.

## 6. Files Inspected / Modification Statement

Files inspected: `README.md`, `AGENTS.md`, `docs/feature-contract.md`, `docs/risk-register.md`, `docs/test-results.md`, `src/App.tsx`, `src/main.tsx` (entry, unchanged from template), `src/lib/bookingRules.ts`, `src/lib/roomFilters.ts`, `src/lib/explanationAdapter.ts`, `src/lib/explanationPrompts.ts`, `src/lib/explanationAdapter.test.ts`, `src/data/rooms.ts`, `src/components/DayTimeline.tsx`, `src/components/RoomFilters.tsx`, `src/components/ResultBanner.tsx`, `src/components/FieldError.tsx`, `src/components/EmptyState.tsx`, `src/components/formStyles.ts`.

Confirmed: no project files were modified by this review. The only file created is this report, `docs/agentic-code-review.md`. No fixes were applied; remediation is deferred to Task #07.
