# AGENTS.md

Guidance for agents working on the Smart Campus Room Availability prototype.

## Project overview

- React 18 + TypeScript + Vite single-page app.
- Main application: `src/App.tsx`. Entry: `src/main.tsx`. Styles: Tailwind via `src/index.css`.
- Booking validation and availability logic live in `src/lib/bookingRules.ts`.
- Room catalog (`ROOMS`, `EQUIPMENT_OPTIONS`) is in `src/data/rooms.ts`. `CURRENT_TIME` (08:30) is defined in `src/App.tsx`.
- Room filters (capacity, equipment) are pure functions in `src/lib/roomFilters.ts`. The filter panel is `src/components/RoomFilters.tsx`.
- No backend, database, authentication, or booking creation. The data is fictional and static.

## Commands

- `npm run typecheck`: TypeScript check (`tsconfig.app.json`).
- `npm run lint`: ESLint.
- `npm run build`: production build. Run this after any change.
- `npm test`: Vitest unit tests (`src/**/*.test.ts`). Booking rules are tested here; keep rule changes covered.

## Refactoring objective

Extract pure booking validation and time-related business rules into `src/lib/bookingRules.ts`, so React UI code only calls rules and renders results.

Target boundary:
- `src/lib/bookingRules.ts` holds pure functions with no React, DOM, or state imports.
- `src/App.tsx` keeps React state, event handlers, JSX, and `DayTimeline`.
- Room catalog and booking data live in `src/data/rooms.ts`. Existing room values must not change unless a requirement says so.

## Behavior that must be preserved

Validation (checked in this order, all errors shown together):
1. A room must be selected. Otherwise: "Please select a room to check."
2. Start time is required, must be within 0 to 1440 minutes, and must be strictly after the current time. Otherwise a start-field error.
3. End time is required and must be within 0 to 1440 minutes. Otherwise an end-field error.
4. If both times are valid: end must be strictly after start, and duration must not exceed the maximum booking duration (120 minutes).

Rule summary: `0 <= start < end <= 1440`, `start > currentTime`, `end - start <= 120`.

Availability (only runs when validation passes):
- A blocked room is unavailable. The message includes the room's blocked reason.
- A room conflicts when any existing booking overlaps the requested interval. Overlap means `start < booking.end && end > booking.start`.
- Endpoint-touching intervals are allowed. Only positive-length overlaps count.
- Otherwise the room is available.

Other UI behavior:
- Duration hint appears when start and end are set and the duration is greater than 0 and at most 120 minutes.
- Changing a time or the attendees/equipment filters clears the previous result and errors.
- Changing the selected room re-runs the check against the new room's bookings when a check is active. The result is derived from the selected room and times, not stored separately.
- Reset clears all fields and results.
- The timeline range (07:00 to 22:00) is a display setting, not a booking rule.

## Refactoring guardrails

- Do not change any user-visible text, layout, styling, or behavior.
- Define the maximum booking duration (120) in one exported constant in `src/lib/bookingRules.ts`. Remove every hard-coded copy, including the duration hint.
- Pass the current time into pure functions as a parameter. Do not read the clock inside rules. `App.tsx` supplies the fixed `CURRENT_TIME`.
- Keep rule functions pure: same inputs, same outputs, no side effects.
- Do not introduce Strategy or Adapter patterns. There is one availability policy and one data format.
- Do not add a backend, database, authentication, or booking creation.
- Do not install dependencies or create a test runner.
- Do not edit `dist/` or `.bolt/`.
- Before changing code, read the current `src/App.tsx` and confirm the behavior above still matches it. If they differ, report the difference instead of silently changing behavior.
- Prefer the `@/` import alias (e.g. `@/lib/bookingRules`) only after confirming it is configured in `vite.config.ts` and `tsconfig.app.json`.
- Use Tailwind classes for styling and lucide-react for icons, as already used in the project.

## Verification after refactoring

- `npm run typecheck`, `npm run lint`, and `npm run build` must pass.
- Manually compare these cases against the pre-refactor behavior:
  - Empty room, empty start, empty end.
  - Start at or before 08:30.
  - End equal to or before start.
  - Duration of exactly 120 minutes (allowed) and 121 minutes (rejected).
  - Blocked room `LAB3`.
  - Interval that exactly touches an existing booking's start or end (allowed).
  - Interval that overlaps an existing booking (unavailable, with the label and times in the message).
  - Available interval (success message with room name and times).
