import { describe, expect, it } from 'vitest';
import {
  canShowExplanation,
  createRequestTokenTracker,
  findExplanationConflict,
} from '@/lib/checkFlow';
import type { RoomSchedule } from '@/lib/bookingRules';

const room: RoomSchedule = {
  name: 'Lecture Theatre 101',
  blocked: false,
  bookings: [
    { start: 480, end: 600, label: 'CS301 Algorithms' },
    { start: 660, end: 780, label: 'MATH202 Calculus' },
  ],
};

describe('canShowExplanation (C-1 regression: Explain button after failed validation)', () => {
  it('shows the button when validation failed, even though no result exists', () => {
    expect(canShowExplanation(false, 2)).toBe(true);
  });

  it('shows the button when a successful check produced a result', () => {
    expect(canShowExplanation(true, 0)).toBe(true);
  });

  it('hides the button before any check attempt', () => {
    expect(canShowExplanation(false, 0)).toBe(false);
  });

  it('hides the button once inputs change clear both the result and the errors', () => {
    expect(canShowExplanation(false, 0)).toBe(false);
  });
});

describe('findExplanationConflict (Q-1 regression: explanations reuse findConflict)', () => {
  it('returns the conflicting booking for an unavailable result', () => {
    expect(findExplanationConflict(room, 'unavailable', 540, 570)?.label).toBe('CS301 Algorithms');
  });

  it('returns undefined for endpoint-touching intervals', () => {
    expect(findExplanationConflict(room, 'unavailable', 450, 480)).toBeUndefined();
    expect(findExplanationConflict(room, 'unavailable', 600, 660)).toBeUndefined();
  });

  it('returns undefined when the result is available', () => {
    expect(findExplanationConflict(room, 'available', 540, 570)).toBeUndefined();
  });

  it('returns undefined when no room is selected', () => {
    expect(findExplanationConflict(null, 'unavailable', 540, 570)).toBeUndefined();
  });

  it('returns undefined for a blocked room, so the explanation stays BLOCKED_ROOM', () => {
    const blocked: RoomSchedule = {
      name: 'Computer Lab 3',
      blocked: true,
      blockedReason: 'Maintenance',
      bookings: [{ start: 540, end: 600, label: 'Web Dev Workshop' }],
    };
    expect(findExplanationConflict(blocked, 'unavailable', 550, 580)).toBeUndefined();
  });
});

describe('createRequestTokenTracker (C-2 regression: stale explanations discarded)', () => {
  it('marks the newest request as current', () => {
    const tracker = createRequestTokenTracker();
    const requestId = tracker.nextRequest();
    expect(tracker.isCurrent(requestId)).toBe(true);
  });

  it('stops treating an in-flight request as current once invalidated', () => {
    const tracker = createRequestTokenTracker();
    const staleId = tracker.nextRequest();
    tracker.invalidate();
    expect(tracker.isCurrent(staleId)).toBe(false);
  });

  it('a newer request supersedes an older one', () => {
    const tracker = createRequestTokenTracker();
    const first = tracker.nextRequest();
    const second = tracker.nextRequest();
    expect(tracker.isCurrent(first)).toBe(false);
    expect(tracker.isCurrent(second)).toBe(true);
  });

  it('never marks a fabricated or future id as current', () => {
    const tracker = createRequestTokenTracker();
    const requestId = tracker.nextRequest();
    expect(tracker.isCurrent(requestId + 1)).toBe(false);
    expect(tracker.isCurrent(requestId - 1)).toBe(false);
  });

  it('discards a request that resolves after invalidation, like a late async response', async () => {
    const tracker = createRequestTokenTracker();
    const requestId = tracker.nextRequest();
    tracker.invalidate();
    await Promise.resolve();
    expect(tracker.isCurrent(requestId)).toBe(false);
  });
});
