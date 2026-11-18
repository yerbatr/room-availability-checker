import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateAvailability,
  validateBookingRequest,
  type RoomSchedule,
} from '@/lib/bookingRules';
import {
  EXPLANATION_FALLBACK_MESSAGE,
  buildExplanationContext,
  classifyReason,
  generateExplanation,
  type ExplanationInput,
} from '@/lib/explanationAdapter';
import { PROMPT_VARIANTS } from '@/lib/explanationPrompts';
import { ROOMS } from '@/data/rooms';

const CURRENT_TIME = 8 * 60 + 30; // 08:30, same as src/App.tsx

const room: RoomSchedule = {
  name: 'Lecture Theatre 101',
  blocked: false,
  bookings: [
    { start: 480, end: 600, label: 'CS301 Algorithms' },
    { start: 660, end: 780, label: 'MATH202 Calculus' },
  ],
};

describe('Task 05 — normal availability test cases', () => {
  it('1. available room: valid interval with no conflicts', () => {
    const result = evaluateAvailability(room, { start: 630, end: 660 });
    expect(result.status).toBe('available');
    expect(result.message).toContain('Lecture Theatre 101');
    expect(result.message).toContain('10:30');
    expect(result.message).toContain('11:00');
  });

  it('2. overlapping booking: room must be unavailable', () => {
    const result = evaluateAvailability(room, { start: 540, end: 570 });
    expect(result.status).toBe('unavailable');
    expect(result.message).toContain('CS301 Algorithms');
    expect(result.message).toContain('08:00');
    expect(result.message).toContain('10:00');
  });

  it('2b. endpoint-touching interval is NOT a conflict', () => {
    expect(evaluateAvailability(room, { start: 450, end: 480 }).status).toBe('available');
    expect(evaluateAvailability(room, { start: 600, end: 660 }).status).toBe('available');
  });

  it('3. blocked room: unavailable with its blocked reason', () => {
    const lab3 = ROOMS.find(r => r.id === 'LAB3');
    expect(lab3).toBeDefined();
    const result = evaluateAvailability(lab3!, { start: 750, end: 780 });
    expect(result.status).toBe('unavailable');
    expect(result.message).toContain(lab3!.blockedReason!);
  });

  it('4. invalid time values must be rejected', () => {
    const errors = validateBookingRequest(
      { roomSelected: true, startTime: '25:00', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(errors.some(e => e.field === 'start')).toBe(true);

    const malformed = validateBookingRequest(
      { roomSelected: true, startTime: 'abc', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(malformed.some(e => e.field === 'start')).toBe(true);

    const reversed = validateBookingRequest(
      { roomSelected: true, startTime: '10:00', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(reversed.some(e => e.field === 'end' && e.message.includes('after start'))).toBe(true);
  });

  it('5. past time: start at or before CURRENT_TIME is rejected', () => {
    const atCurrent = validateBookingRequest(
      { roomSelected: true, startTime: '08:30', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(atCurrent.some(e => e.field === 'start' && e.message.includes('after the current time'))).toBe(true);

    const beforeCurrent = validateBookingRequest(
      { roomSelected: true, startTime: '08:00', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(beforeCurrent.some(e => e.field === 'start')).toBe(true);

    const afterCurrent = validateBookingRequest(
      { roomSelected: true, startTime: '08:31', endTime: '09:00' },
      CURRENT_TIME
    );
    expect(afterCurrent).toEqual([]);
  });
});

describe('Task 05 — failure and edge cases', () => {
  it('1. empty input: no invented facts, safe UNKNOWN explanation', async () => {
    const result = await generateExplanation({}, 0);
    expect(result.reasonCode).toBe('UNKNOWN');
    expect(result.explanation).toBe(
      'No explanation is available for this result. The availability status shown above is authoritative.'
    );
    expect(result.explanation).not.toContain('undefined');
    expect(result.explanation).not.toContain('NaN');
  });

  it('1b. incomplete structured input: missing conflict details stay generic', async () => {
    const result = await generateExplanation(
      { status: 'unavailable', conflict: {} },
      0
    );
    expect(result.reasonCode).toBe('BOOKING_CONFLICT');
    expect(result.explanation).toContain('overlaps an existing booking');
    expect(result.explanation).not.toContain('undefined');
  });

  it('2. long input: long names and labels are handled safely', async () => {
    const longName = 'R'.repeat(10000);
    const longLabel = 'L'.repeat(10000);
    const longReason = 'M'.repeat(10000);
    const input: ExplanationInput = {
      roomId: 'X1',
      roomName: longName,
      status: 'unavailable',
      blocked: true,
      blockedReason: longReason,
      conflict: { label: longLabel, start: 540, end: 600 },
    };
    const result = await generateExplanation(input, 0);
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.explanation).not.toContain('undefined');
    expect(result.explanation).not.toContain('NaN');
    expect(result.reasonCode).toBe('BLOCKED_ROOM');

    const conflictResult = await generateExplanation(
      { status: 'unavailable', conflict: { label: longLabel, start: 540, end: 600 } },
      0
    );
    expect(conflictResult.explanation).toContain(longLabel);
    expect(conflictResult.reasonCode).toBe('BOOKING_CONFLICT');
  });

  it('2b. non-string junk in text fields does not crash the adapter', async () => {
    const result = await generateExplanation(
      {
        roomName: 42,
        status: 'unavailable',
        blocked: true,
        blockedReason: null,
        conflict: { label: 99, start: Number.NaN, end: 600 },
      } as unknown as ExplanationInput,
      0
    );
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.explanation).not.toContain('undefined');
    expect(result.explanation).not.toContain('NaN');
  });

  describe('timeout and failure (UI fallback contract)', () => {
    let explanationNeverSettles = false;

    beforeEach(() => {
      explanationNeverSettles = false;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function simulateAdapter(input: ExplanationInput, mode: 'timeout' | 'reject' | 'ok') {
      if (mode === 'timeout') {
        // A promise that never settles unless the timeout guard fires.
        explanationNeverSettles = true;
        return new Promise<never>(() => {});
      }
      if (mode === 'reject') {
        return Promise.reject(new Error('Explanation adapter failure: simulated.'));
      }
      return generateExplanation(input, 0);
    }

    async function runWithTimeoutGuard<T>(
      promise: Promise<T>,
      timeoutMs: number
    ): Promise<T | { timedOut: true }> {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<{ timedOut: true }>(resolve => {
        timer = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
      });
      try {
        return await Promise.race([promise, timeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    it('3. timeout: adapter that never settles loses the race; fallback is shown', async () => {
      const pending = simulateAdapter({ status: 'available' }, 'timeout');
      const raced = runWithTimeoutGuard(pending, 2000);
      await vi.advanceTimersByTimeAsync(2000);
      expect(await raced).toEqual({ timedOut: true });
      expect(explanationNeverSettles).toBe(true);
      expect(EXPLANATION_FALLBACK_MESSAGE).toContain('temporarily unavailable');
      expect(EXPLANATION_FALLBACK_MESSAGE).toContain('remains accurate');
    });

    it('4. simulated API failure: rejection is caught, fallback shown, result untouched', async () => {
      const deterministicResult = evaluateAvailability(room, { start: 630, end: 660 });
      expect(deterministicResult.status).toBe('available');

      let explanationError: string | null = null;
      try {
        await simulateAdapter({ status: 'available' }, 'reject');
      } catch {
        explanationError = EXPLANATION_FALLBACK_MESSAGE;
      }

      expect(explanationError).toBe(EXPLANATION_FALLBACK_MESSAGE);
      expect(deterministicResult.status).toBe('available');
      expect(deterministicResult.message).toContain("you're good to go");
    });
  });
});

describe('Task 05 — deterministic decision integrity', () => {
  const range = { start: 630, end: 660 };

  it('every prompt variant leaves the deterministic status and reason code unchanged', () => {
    for (const instruction of Object.values(PROMPT_VARIANTS)) {
      for (const status of ['available', 'unavailable'] as const) {
        const input: ExplanationInput = {
          roomName: 'Lecture Theatre 101',
          status,
          startMinutes: range.start,
          endMinutes: range.end,
          blocked: status === 'unavailable',
          blockedReason: status === 'unavailable' ? 'Maintenance' : null,
        };
        const context = buildExplanationContext(input, instruction);
        expect(context.systemInstruction).toBe(instruction);
        expect(context.structuredInput.status).toBe(status);
        expect(context.reasonCode).toBe(classifyReason(input));
      }
    }
  });

  it('adapter output can never flip an available result to unavailable or back', async () => {
    const availableResult = evaluateAvailability(room, range);
    expect(availableResult.status).toBe('available');

    const explanation = await generateExplanation(
      { roomName: room.name, status: 'available', startMinutes: range.start, endMinutes: range.end },
      0
    );
    expect(explanation.reasonCode).toBe('AVAILABLE');

    const stillAvailable = evaluateAvailability(room, range);
    expect(stillAvailable).toEqual(availableResult);
    expect(explanation.explanation).not.toContain('unavailable');

    const unavailableResult = evaluateAvailability(room, { start: 540, end: 570 });
    expect(unavailableResult.status).toBe('unavailable');
    const conflictExplanation = await generateExplanation(
      {
        roomName: room.name,
        status: unavailableResult.status,
        startMinutes: 540,
        endMinutes: 570,
        conflict: { label: 'CS301 Algorithms', start: 480, end: 600 },
      },
      0
    );
    expect(conflictExplanation.reasonCode).toBe('BOOKING_CONFLICT');
    expect(evaluateAvailability(room, { start: 540, end: 570 })).toEqual(unavailableResult);
  });

  it('classifyReason is a pure function of the input; prompts are not inputs to it', () => {
    const input: ExplanationInput = { status: 'available' };
    expect(classifyReason(input)).toBe('AVAILABLE');
    expect(classifyReason(input)).toBe('AVAILABLE');
    input.status = 'unavailable';
    expect(classifyReason(input)).toBe('UNKNOWN');
  });

  it('rule functions are pure: repeated evaluation does not mutate rooms or bookings', () => {
    const snapshot = structuredClone(room);
    evaluateAvailability(room, range);
    evaluateAvailability(room, { start: 540, end: 570 });
    expect(room).toEqual(snapshot);

    for (const catalogRoom of ROOMS) {
      const catalogSnapshot = structuredClone(catalogRoom);
      evaluateAvailability(catalogRoom, { start: 600, end: 660 });
      expect(catalogRoom).toEqual(catalogSnapshot);
    }
  });
});
