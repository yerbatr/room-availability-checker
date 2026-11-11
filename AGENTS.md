# AGENTS.md

Guidance for agents working on the Smart Campus Room Availability prototype.

## Project overview

- React 18 + TypeScript + Vite single-page app.
- Entry: `src/main.tsx`. Styles: Tailwind via `src/index.css`.
- Screen and state: `src/App.tsx` (filter and time state, handlers, page layout, room details).
- Shared UI: `src/components/` (`RoomFilters`, `DayTimeline`, `FieldError`, `ResultBanner`, `EmptyState`, `formStyles`).
- Pure rules: `src/lib/bookingRules.ts` (time parsing, validation, overlap, duration, availability) and `src/lib/roomFilters.ts` (capacity and equipment filters, attendee parsing, selection after filtering).
- Room catalog and booking data: `src/data/rooms.ts`. `CURRENT_TIME` (08:30) is defined in `src/App.tsx`.
- No backend, database, authentication, or booking creation. The data is fictional and static.

## Commands

- `npm test`: Vitest unit tests (`src/**/*.test.ts`). Booking rules, room filters, and catalog data are tested here.
- `npm run typecheck`: TypeScript check (`tsconfig.app.json`).
- `npm run lint`: ESLint.
- `npm run build`: production build. Run this after any change.

## Architecture boundaries

- Rule functions in `src/lib` are pure: no React, DOM, or state imports, and the current time is passed in as a parameter.
- Components in `src/components` render results and call handlers. They do not contain validation or availability logic.
- `src/App.tsx` owns React state and event handlers. Time strings are parsed once per render and the parsed minutes are reused for availability, the duration hint, and the timeline.
- Room catalog and booking data stay in `src/data/rooms.ts`. Existing values must not change unless a requirement says so.
- Do not introduce Context, Redux, or other state libraries for this single-screen app.

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

Room filters:
- Capacity: a room is shown only if its capacity is at least the attendee count. An empty attendee field means no capacity filter.
- Equipment: a room is shown only if it contains every selected equipment item.
- Blocked rooms that match the filters are still shown, and are always reported unavailable.
- If no room matches, an empty state explains this and offers to clear the filters.
- If the selected room is filtered out, the selection is cleared.

Other UI behavior:
- Duration hint appears when start and end are set and the duration is greater than 0 and at most 120 minutes.
- Changing a time or the attendees/equipment filters clears the previous result and errors.
- Changing the selected room re-runs the check against the new room's bookings when a check is active. The result is derived from the selected room and times, not stored separately.
- Reset clears all fields and results.
- The timeline range (07:00 to 22:00) is a display setting, not a booking rule.

## Guardrails

- Do not change any user-visible text, layout, styling, or behavior unless a requirement asks for it.
- Define the maximum booking duration (120) in one exported constant in `src/lib/bookingRules.ts`. Remove every hard-coded copy.
- Keep rule functions pure: same inputs, same outputs, no side effects.
- Do not introduce Strategy or Adapter patterns. There is one availability policy and one data format.
- Do not add a backend, database, authentication, or booking creation.
- Vitest is the only test runner. Do not add another test framework or install new dependencies without approval.
- Do not edit `dist/` or `.bolt/`.
- Prefer the `@/` import alias (for example `@/lib/bookingRules`), which maps to `src/`.
- Use Tailwind classes for styling and lucide-react for icons, as already used in the project.

## Agent Operations and Safety

- Work only within the existing fictional Smart Campus Room Availability prototype.
- Do not add external APIs, integrations, services, or network-dependent features.
- Do not deploy, publish, or externally expose the application.
- Do not push commits or perform external repository actions without explicit human approval.
- Preserve all existing room catalog and booking data unless a requirement explicitly requests a change.
- For parallel or background agent tasks, use isolated branches or worktrees. Do not allow multiple agents to modify the same files concurrently.
- Do not overwrite or discard another contributor's changes. Stop and report conflicts before resolving them.
- Before proposing a change as complete, run the relevant tests and verification commands and report their actual results.
- Do not claim that a test, build, or verification passed unless it was actually executed successfully.
- Ask for human approval before adding dependencies, changing project scope, or performing actions outside the local development environment.

## Verification

- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` must pass.
- Manually check these cases in the UI:
  - Empty room, empty start, empty end.
  - Start at or before 08:30.
  - End equal to or before start.
  - Duration of exactly 120 minutes (allowed) and 121 minutes (rejected).
  - Blocked room `LAB3`.
  - Interval that exactly touches an existing booking's start or end (allowed).
  - Interval that overlaps an existing booking (unavailable, with the label and times in the message).
  - Available interval (success message with room name and times).
  - Changing the room while a check is shown refreshes the result for the new room.
