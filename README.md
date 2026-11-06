# Smart Campus Room Availability Checker

A React and TypeScript web application for checking room availability in a fictional university campus. Users can select a room, specify a time interval, and check whether the room is available.

## Features

- Room availability checking.
- Fictional room data with individual booking schedules.
- Booking time validation.
- Maximum booking duration of 120 minutes.
- Detection of overlapping bookings.
- Support for intervals that touch at their endpoints.
- Blocked room handling.
- Room capacity filtering.
- Room equipment filtering.
- Responsive user interface.

## Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest
- ESLint

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone <https://github.com/yerbatr/room-availability-checker.git>
```

Navigate to the project directory:

```bash
cd <room-availability-checker>
```

Install dependencies:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Testing and Verification

Run automated tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Booking Rules

The application follows these booking rules:

- A room must not be blocked.
- Start and end times must be valid.
- A booking cannot start in the past relative to the configured current time.
- The maximum booking duration is 120 minutes.
- Overlapping bookings are not allowed.
- Two intervals that touch exactly at their endpoints are considered non-overlapping.
- Availability checks must not modify the original booking data.

## Room Filtering

The application provides a fictional room catalog.

Users can filter rooms according to:

- **Capacity:** room capacity must be greater than or equal to the requested number of attendees.
- **Equipment:** a room must contain all selected required equipment items.

The application displays an empty state when no rooms match the selected requirements.

## Project Structure

```text
src/
├── data/
│   └── rooms.ts
├── lib/
│   ├── bookingRules.ts
│   ├── bookingRules.test.ts
│   ├── roomFilters.ts
│   └── roomFilters.test.ts
├── App.tsx
└── main.tsx

AGENTS.md
README.md
package.json
```
