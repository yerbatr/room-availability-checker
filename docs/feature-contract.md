# Feature Contract: Explain Availability

## 1. User Story

As a university student or staff member, I want to receive a simple explanation of a room availability result so that I can understand why a room is available or unavailable.

## 2. Feature Description

The application will provide a human-readable explanation of the existing room availability check.

A Mock LLM Adapter will simulate an AI explanation service.

The adapter will receive structured availability information and generate an explanation based on the provided data.

The existing deterministic booking rules remain the single source of truth.

## 3. Inputs

The feature accepts:

- Room ID and room name.
- Availability status.
- Requested start time.
- Requested end time.
- Existing booking information when a conflict occurs.
- Blocked room reason when applicable.
- Validation errors when the request is invalid.

## 4. Outputs

The feature returns:

- A human-readable explanation.
- The original availability status.
- Relevant information about conflicts or blocking reasons.
- An appropriate explanation for invalid requests.

## 5. Acceptance Criteria

**AC1 — Available Room**

When a room is available, the explanation must confirm its availability and include the requested time interval.

**AC2 — Booking Conflict**

When a booking conflict exists, the explanation must identify the conflicting booking and its time interval.

**AC3 — Blocked Room**

When a room is blocked, the explanation must include the original blocking reason.

**AC4 — Invalid Input**

When the booking request is invalid, the explanation must describe the validation error.

**AC5 — Deterministic Results**

The Mock LLM Adapter must never calculate or independently determine room availability. It must use the existing availability result.

**AC6 — No External Services**

The implementation must not require external APIs, API keys, backend services, or network connections.

**AC7 — Data Integrity**

The feature must not modify the original room catalog or booking data.

**AC8 — Failure Handling**

If the explanation adapter fails, the original availability result must remain available to the user.

## 6. Failure Behavior

- Missing input: return an appropriate validation explanation.
- Missing conflict details: provide a generic conflict explanation without inventing information.
- Missing blocking reason: provide a generic blocked-room explanation.
- Adapter failure: display a fallback explanation.
- Unexpected input: handle safely without changing the availability result.

## 7. Technical Constraints

- React 18.
- TypeScript.
- Existing booking rules must remain unchanged.
- Existing room catalog must be preserved.
- Vitest remains the only testing framework.
- No external AI APIs.
- No backend or database.
- All explanations must be based on actual application data.