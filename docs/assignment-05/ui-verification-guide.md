# Manual UI Verification Guide

This guide covers the interaction checks listed in the root `AGENTS.md`. The assistant could not execute browser interactions in its current environment; do not treat this guide as completed test evidence. Run from the repository root.

## Start

1. Run `npm run dev`.
2. Open the local URL printed by Vite.
3. For each row, record PASS/FAIL, actual message, and a screenshot filename. Reset between cases unless a row says otherwise.

| Case | Inputs / action | Expected observation |
|---|---|---|
| Empty submission | Leave room and times empty; click **Check Availability**. | Required room/start/end errors appear; no availability outcome is fabricated. |
| Start at current time | Select any room; start `08:30`, end `09:00`; check. | Start-time error because start must be after 08:30. |
| Start before current time | Start `08:29`, end `09:00`; check. | Start-time error. |
| End not after start | Start `09:00`, end `09:00`; check. Repeat with end `08:45`. | End-time error in both cases. |
| Exactly maximum | Use an otherwise-free room (for example CR305), start `09:00`, end `11:00`; check. | Duration 120 minutes accepted; availability depends on the selected room's bookings (CR305 has a booking 08:00–09:00 and 14:00–16:00, so this interval should be available). |
| Over maximum | Start `09:00`, end `11:01`; check. | Duration error; request is rejected. |
| Blocked room | Select `Computer Lab 3 (Blocked)` (LAB3), use `09:00`–`09:30`; check. | Unavailable result includes “Under scheduled maintenance until further notice.” |
| Touch existing booking end | Select LT101; request `10:00`–`10:30` (existing booking ends 10:00); check. | Available; endpoint touch is allowed. |
| Touch existing booking start | Select LT101; request `07:30`–`08:00` (existing booking starts 08:00); check. | Start is before configured current time, so validation rejects. This is not a valid endpoint-touch UI test under current-time constraints; test `findConflict` unit coverage confirms the reverse endpoint case. |
| Overlap existing booking | Select LT101; request `09:30`–`10:15`; check. | Unavailable and identifies CS301 Algorithms with interval 08:00–10:00. |
| Available interval | Select CR305; request `10:00`–`11:00`; check. | Available with room name and times. |
| Change room after result | With LT101 checked at `09:30`–`10:15`, change room to CR305. | Result refreshes based on CR305 and the same time range (available). |

## Evidence log

| Case | PASS/FAIL/NOT RUN | Actual observation | Screenshot file | Date/operator |
|---|---|---|---|---|
|  |  |  |  |  |

Save screenshots under an evidence folder outside `dist/` and `.bolt/`. Do not include personal or secret data. If actual output differs, record it exactly and report the failing case; do not change application code as part of this verification step.
