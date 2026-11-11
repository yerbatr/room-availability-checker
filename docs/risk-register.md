# Risk Register — Smart Campus Room Availability Checker

Score = Likelihood × Impact

| ID | Category | Risk / Cause and consequence | Affected component | Evidence | L | I | Score |
|---|---|---|---|---|---:|---:|---:|
| R1 | Correctness | Malformed time input is not validated. Invalid values such as NaN may affect booking validation. | bookingRules.ts — timeToMinutes() | No format or range checks. | 3 | 3 | 9 |
| R4 | Correctness | Fixed CURRENT_TIME makes the application always behave as if the time is 08:30. | App.tsx — CURRENT_TIME | Constant is reused in validation, header and timeline. | 3 | 2 | 6 |
| R7 | Security / Agent operations | Missing .env.* ignore pattern may allow environment-specific files to be committed accidentally. | .gitignore | .env is ignored, but .env.* is not. | 2 | 3 | 6 |
| R6 | Correctness | Bookings outside the 07:00–22:00 timeline range may become invisible. | DayTimeline.tsx — toPercent() | A 23:00–23:30 interval produces zero visual width. | 2 | 2 | 4 |
| R5 | Maintainability | Array indexes used as React keys may cause incorrect reconciliation if booking items are reordered or removed. | App.tsx, DayTimeline.tsx | Booking lists use key={i}. | 2 | 1 | 2 |

## Mitigation Plan

| ID | Proposed mitigation | Owner | Verification method |
|---|---|---|---|
| R1 | Validate strict HH:MM format and hour/minute ranges. | Developer | Add unit tests for malformed and out-of-range values. |
| R4 | Use a dynamic time source or inject current time as a dependency. | Developer | Test with different current-time values. |
| R7 | Add .env.* to .gitignore while preserving .env.example. | Developer | Run git check-ignore and inspect git status. |
| R6 | Handle bookings outside the visible timeline range explicitly. | Developer | Test intervals before, inside and after 07:00–22:00. |
| R5 | Use stable unique booking identifiers as React keys. | Developer | Inspect both list renderings and test list updates. |

## Top Two Risks for Mitigation

1. **R1 — Malformed time input (Score: 9).** Highest priority because invalid values can affect booking calculations.
2. **R7 — Incomplete environment-file ignore rules (Score: 6).** Selected because of potential security implications.