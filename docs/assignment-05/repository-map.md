# Assignment #05 — Repository Map

## Application entry points

- `index.html` provides the page shell and root element.
- `src/main.tsx` mounts React `App` and loads `src/index.css`.
- `src/App.tsx` owns the single-screen UI, state, handlers, and fixed current-time setting.

## Modules and data

- `src/components/`: `RoomFilters`, `DayTimeline`, `FieldError`, `ResultBanner`, `EmptyState`, and `formStyles`.
- `src/lib/bookingRules.ts`: time conversion, validation, duration, overlap, and availability rules.
- `src/lib/roomFilters.ts`: attendee parsing, capacity/equipment filtering, selected-room behavior.
- `src/lib/checkFlow.ts`: check/explanation flow helpers.
- `src/lib/explanationAdapter.ts` and `src/lib/explanationPrompts.ts`: mock explanation formatting/prompt variants; availability remains deterministic.
- `src/data/rooms.ts`: fictional static room catalog and bookings.

## Tests and configuration

- Vitest tests: `src/data/rooms.test.ts`, `src/lib/checkFlow.test.ts`, `bookingRules.test.ts`, `roomFilters.test.ts`, `scenarios.test.ts`, `explanationAdapter.test.ts`.
- Test command: `npm test` (`vitest run`); watch command: `npm run test:watch` (`vitest`). Vite config: `vite.config.ts`; no separate Vitest config was listed.
- TypeScript: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`; typecheck script uses app config.
- Lint: `eslint.config.js`; `npm run lint` invokes `eslint .`.
- Build: `npm run build` invokes `vite build`; `npm run dev` starts Vite; `npm run preview` runs Vite preview.
- Styling: Tailwind (`tailwind.config.js`, `postcss.config.js`, `src/index.css`).

## Dependencies

- Runtime: React 18, React DOM, lucide-react, and declared `@supabase/supabase-js`.
- Development: Vite, TypeScript, Vitest, ESLint, Tailwind, PostCSS, React/Vite plugins and type packages.
- `package-lock.json` is present. Source search did not find Supabase usage; see baseline report for classification.

## Documentation and operating guidance

- `README.md`: setup, scripts, feature overview, and abbreviated project tree.
- `AGENTS.md`: architecture constraints, acceptance criteria, safety boundaries, and manual verification cases.
- Existing `docs/`: `feature-contract.md`, `test-results.md`, `risk-register.md`, `agentic-code-review.md`.
- Assignment artifacts are stored under `docs/assignment-05/`.
