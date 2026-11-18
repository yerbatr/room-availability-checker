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

## 8. Implementation Notes

- Adapter module: `src/lib/explanationAdapter.ts`. It exports `generateExplanation(input)` (async, resolves after a simulated delay), `classifyReason(input)`, and `EXPLANATION_FALLBACK_MESSAGE`.
- Reason codes: `AVAILABLE`, `BOOKING_CONFLICT`, `BLOCKED_ROOM`, `INVALID_REQUEST`, `UNKNOWN`.
- Classification order: validation errors take precedence, then availability status, then blocked/conflict detail. An unrecognized payload yields `UNKNOWN`.
- The UI (`src/App.tsx`) shows an "Explain Availability" button after a check runs — including when validation failed — and renders the explanation below the availability result with its reason code.
- If the adapter rejects, the UI shows the fallback message and the original availability result stays untouched.
- The adapter is pure with respect to its input: it never mutates the payload, the room catalog, or booking data.
- Tests: `src/lib/explanationAdapter.test.ts` (24 tests covering all four explanation types, reason codes, incomplete data, adapter failure, input integrity, the system instruction, and prompt variants).
- Prompt variants: `src/lib/explanationPrompts.ts` exports the three variants, the selected `SYSTEM_INSTRUCTION`, and `buildPromptWithInstruction`. See section 9.

## 9. System Instruction and Prompt Comparison

### Final system instruction (selected: Prompt C — strict factual)

> Role: You are an availability explanation assistant for a campus room booking prototype.
> The deterministic availability checker has already decided the result. You explain it; you never override, reinterpret, or re-evaluate it.
> Facts: Use only the facts supplied in the structured input. Never invent room details, booking names, times, blocked reasons, or availability causes. Never make unsupported claims.
> Missing information: If a detail you would normally include is missing, omit it or say it is not available. Do not assume or guess.
> Style: Be concise, respectful, and user-friendly. Address the user directly and, where it helps, suggest checking a different time without promising availability.

### Structured context example

The adapter receives and forwards this shape (from `buildExplanationContext`):

```json
{
  "systemInstruction": "<selected prompt text>",
  "reasonCode": "BOOKING_CONFLICT",
  "structuredInput": {
    "roomId": "LT101",
    "roomName": "Lecture Theatre 101",
    "status": "unavailable",
    "startMinutes": 540,
    "endMinutes": 600,
    "conflict": { "label": "CS301 Algorithms", "start": 480, "end": 600 },
    "blocked": false,
    "blockedReason": null
  }
}
```

Reason codes remain: `AVAILABLE`, `BLOCKED_ROOM`, `BOOKING_CONFLICT`, `INVALID_REQUEST`, `UNKNOWN`.

### Prompt variants

**Prompt A — Basic.** "You explain room availability results to campus users. Explain the result using only the facts supplied in the structured input. Be concise and user-friendly."

**Prompt B — Structured.** Roles plus explicit context fields (roomName, status, reasonCode, interval, conflict, blockedReason, validationErrors) and six numbered response requirements, ending with "use only the supplied facts and nothing else."

**Prompt C — Strict factual.** As quoted above: no override of the deterministic result, only supplied facts, explicit missing-information rule, concise and respectful style.

### Comparison (same scenarios: available, conflict, blocked, invalid, missing data; scale 1–5)

| Criterion | A — Basic | B — Structured | C — Strict factual |
|---|:---:|:---:|:---:|
| Clarity | 3 | 4 | 5 |
| Consistency | 2 | 4 | 5 |
| Factual agreement | 3 | 4 | 5 |

- **Clarity:** A is short but vague about tone and structure; B is clear but verbose; C is precise and user-focused.
- **Consistency:** A leaves output format to the model, so wording drifts across scenarios; B's numbered requirements stabilize it; C adds the missing-information rule, keeping behavior stable even for incomplete input.
- **Factual agreement:** A and B say "use supplied facts" but do not explicitly forbid re-evaluating the deterministic result or guessing; C prohibits override, invention, and assumptions outright.

**Scope of these scores.** The three prompt scores above are a static, design-time evaluation of the prompt texts only. No real LLM was executed to produce them. The current adapter is a mock implementation with no real AI API connection. Runtime behavior is verified through the adapter unit tests in `src/lib/explanationAdapter.test.ts`.

### Selected prompt and justification

Prompt C is selected. It is the only variant that (1) explicitly subordinates the model to the deterministic checker — the core requirement of this feature, (2) defines behavior for missing information, which is where hallucination risk is highest, and (3) still satisfies the clarity and tone requirements. B is the runner-up and is a good fallback if richer formatting is ever needed; A is too under-specified for production use.