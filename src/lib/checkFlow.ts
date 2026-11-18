import {
  findConflict,
  type AvailabilityResult,
  type Booking,
  type RoomSchedule,
} from '@/lib/bookingRules';

/**
 * Explain-button gate. The button appears after any check attempt:
 * when a result exists, or when validation failed (INVALID_REQUEST path).
 */
export function canShowExplanation(hasOutcome: boolean, validationErrorCount: number): boolean {
  return hasOutcome || validationErrorCount > 0;
}

/**
 * Conflict context for the explanation adapter, resolved with the rule
 * module's findConflict so the overlap rule is never duplicated.
 */
export function findExplanationConflict(
  room: RoomSchedule | null,
  status: AvailabilityResult['status'] | undefined,
  start: number,
  end: number
): Booking | undefined {
  if (!room || status !== 'unavailable' || room.blocked) {
    return undefined;
  }
  return findConflict({ start, end }, room.bookings);
}

/**
 * Tracks explanation requests so a late-resolving async call can detect
 * that its inputs changed while it was pending and discard its result.
 */
export interface RequestTokenTracker {
  nextRequest(): number;
  isCurrent(requestId: number): boolean;
  invalidate(): void;
}

export function createRequestTokenTracker(): RequestTokenTracker {
  let current = 0;
  return {
    nextRequest: () => ++current,
    isCurrent: requestId => requestId === current,
    invalidate: () => {
      current += 1;
    },
  };
}
