import { describe, expect, it, vi } from 'vitest';
import {
  EXPLANATION_FALLBACK_MESSAGE,
  buildExplanationContext,
  classifyReason,
  generateExplanation,
  type ExplanationInput,
} from '@/lib/explanationAdapter';
import {
  PROMPT_VARIANTS,
  SYSTEM_INSTRUCTION,
  buildPromptWithInstruction,
} from '@/lib/explanationPrompts';

const VALID_INPUT: ExplanationInput = {
  roomId: 'LT101',
  roomName: 'Lecture Theatre 101',
  status: 'available',
  startMinutes: 540,
  endMinutes: 600,
};

describe('available room explanation', () => {
  it('confirms availability and includes the requested interval', async () => {
    const result = await generateExplanation(VALID_INPUT, 0);
    expect(result.reasonCode).toBe('AVAILABLE');
    expect(result.explanation).toContain('Lecture Theatre 101');
    expect(result.explanation).toContain('09:00');
    expect(result.explanation).toContain('10:00');
  });
});

describe('booking conflict explanation', () => {
  it('identifies the conflicting booking and its interval', async () => {
    const result = await generateExplanation(
      {
        ...VALID_INPUT,
        status: 'unavailable',
        conflict: { label: 'CS301 Algorithms', start: 480, end: 600 },
      },
      0
    );
    expect(result.reasonCode).toBe('BOOKING_CONFLICT');
    expect(result.explanation).toContain('CS301 Algorithms');
    expect(result.explanation).toContain('08:00');
    expect(result.explanation).toContain('10:00');
  });

  it('gives a generic conflict explanation when conflict details are missing', async () => {
    const result = await generateExplanation(
      { ...VALID_INPUT, status: 'unavailable', conflict: {} },
      0
    );
    expect(result.reasonCode).toBe('BOOKING_CONFLICT');
    expect(result.explanation).toContain('overlaps an existing booking');
  });
});

describe('blocked room explanation', () => {
  it('includes the original blocking reason', async () => {
    const result = await generateExplanation(
      {
        ...VALID_INPUT,
        status: 'unavailable',
        blocked: true,
        blockedReason: 'Under scheduled maintenance until further notice',
      },
      0
    );
    expect(result.reasonCode).toBe('BLOCKED_ROOM');
    expect(result.explanation).toContain('Under scheduled maintenance until further notice');
  });

  it('gives a generic blocked explanation when the reason is missing', async () => {
    const result = await generateExplanation(
      { ...VALID_INPUT, status: 'unavailable', blocked: true },
      0
    );
    expect(result.reasonCode).toBe('BLOCKED_ROOM');
    expect(result.explanation).toContain('blocked');
  });
});

describe('invalid request explanation', () => {
  it('describes the validation errors', async () => {
    const result = await generateExplanation(
      {
        status: 'unavailable',
        validationErrors: [
          { field: 'start', message: 'Start time is required.' },
          { field: 'end', message: 'End time must be after start time.' },
        ],
      },
      0
    );
    expect(result.reasonCode).toBe('INVALID_REQUEST');
    expect(result.explanation).toContain('Start time is required.');
    expect(result.explanation).toContain('End time must be after start time.');
  });

  it('gives a generic invalid-request explanation when messages are missing', async () => {
    const result = await generateExplanation(
      { status: 'unavailable', validationErrors: [{ field: 'start', message: '' }] },
      0
    );
    expect(result.reasonCode).toBe('INVALID_REQUEST');
    expect(result.explanation).toContain('incomplete');
  });
});

describe('reason code correctness', () => {
  it('classifies every scenario without generating text', () => {
    expect(classifyReason({ status: 'available' })).toBe('AVAILABLE');
    expect(
      classifyReason({ status: 'unavailable', conflict: { label: 'X' } })
    ).toBe('BOOKING_CONFLICT');
    expect(classifyReason({ status: 'unavailable', blocked: true })).toBe('BLOCKED_ROOM');
    expect(
      classifyReason({ status: 'unavailable', validationErrors: [{ field: 'start', message: 'x' }] })
    ).toBe('INVALID_REQUEST');
    expect(classifyReason({ status: 'unavailable' })).toBe('UNKNOWN');
    expect(classifyReason({})).toBe('UNKNOWN');
  });

  it('prefers validation errors over the availability status', () => {
    expect(
      classifyReason({ ...VALID_INPUT, validationErrors: [{ field: 'start', message: 'x' }] })
    ).toBe('INVALID_REQUEST');
  });
});

describe('missing or incomplete structured data', () => {
  it('returns UNKNOWN with a safe explanation for an empty payload', async () => {
    const result = await generateExplanation({}, 0);
    expect(result.reasonCode).toBe('UNKNOWN');
    expect(result.explanation).toContain('No explanation is available');
  });

  it('treats a missing room name as a generic room reference', async () => {
    const result = await generateExplanation({ status: 'available' }, 0);
    expect(result.explanation).toContain('This room is available');
  });

  it('ignores non-numeric times by omitting the interval', async () => {
    const result = await generateExplanation(
      { status: 'available', startMinutes: Number.NaN, endMinutes: 600 },
      0
    );
    expect(result.explanation).not.toContain('NaN');
  });
});

describe('adapter failure and fallback behavior', () => {
  it('rejects when given an invalid payload so the caller can fall back', async () => {
    await expect(
      generateExplanation(null as unknown as ExplanationInput)
    ).rejects.toThrow('Explanation adapter failure');
  });

  it('exposes a stable fallback message for the UI to show on failure', () => {
    expect(EXPLANATION_FALLBACK_MESSAGE).toContain('temporarily unavailable');
    expect(EXPLANATION_FALLBACK_MESSAGE).toContain('availability result shown above remains accurate');
  });
});

describe('data integrity', () => {
  it('does not modify the structured input it receives', async () => {
    const input: ExplanationInput = {
      roomId: 'SR204',
      roomName: 'Seminar Room 204',
      status: 'unavailable',
      blocked: true,
      blockedReason: 'Maintenance',
      conflict: { label: 'X', start: 540, end: 600 },
      validationErrors: [{ field: 'start', message: 'y' }],
    };
    const snapshot = structuredClone(input);

    await generateExplanation(input, 0);

    expect(input).toEqual(snapshot);
  });
});

describe('simulation behavior', () => {
  it('resolves asynchronously like a remote service would', async () => {
    vi.useFakeTimers();
    const promise = generateExplanation(VALID_INPUT);
    let resolved = false;
    promise.then(() => { resolved = true; });
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(250);
    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});

describe('system instruction and prompt variants', () => {
  it('restricts the model to supplied facts in the system instruction', () => {
    expect(SYSTEM_INSTRUCTION).toMatch(/only the facts supplied/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/never invent/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/never (override|make unsupported)/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/do not assume or guess/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/concise, respectful/i);
  });

  it('exposes all three prompt variants for comparison', () => {
    expect(Object.keys(PROMPT_VARIANTS).sort()).toEqual(['basic', 'strict', 'structured']);
    for (const text of Object.values(PROMPT_VARIANTS)) {
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('includes the deterministic result and reason code in the structured context', () => {
    const context = buildExplanationContext({
      ...VALID_INPUT,
      status: 'unavailable',
      blocked: true,
      blockedReason: 'Maintenance',
    });
    expect(context.structuredInput.status).toBe('unavailable');
    expect(context.reasonCode).toBe('BLOCKED_ROOM');
    expect(context.structuredInput).toEqual(
      expect.objectContaining({ roomName: 'Lecture Theatre 101' })
    );
  });

  it('uses the selected strict prompt as the default system instruction', () => {
    const context = buildExplanationContext(VALID_INPUT);
    expect(context.systemInstruction).toBe(SYSTEM_INSTRUCTION);
    expect(context.systemInstruction).toBe(PROMPT_VARIANTS.strict);
  });

  it('accepts an alternative prompt variant when building the context', () => {
    const context = buildExplanationContext(VALID_INPUT, PROMPT_VARIANTS.basic);
    expect(context.systemInstruction).toBe(PROMPT_VARIANTS.basic);
  });

  it('builds a full prompt containing the instruction and the structured data', () => {
    const prompt = buildPromptWithInstruction(SYSTEM_INSTRUCTION, VALID_INPUT);
    expect(prompt).toContain(SYSTEM_INSTRUCTION);
    expect(prompt).toContain('"roomName"');
    expect(prompt).toContain('"status"');
  });

  it('keeps every explanation consistent with the deterministic result across variants', async () => {
    const unavailable = {
      ...VALID_INPUT,
      status: 'unavailable' as const,
      blocked: true,
      blockedReason: 'Closed for maintenance',
    };
    for (const instruction of Object.values(PROMPT_VARIANTS)) {
      const context = buildExplanationContext(unavailable, instruction);
      expect(context.systemInstruction).toBe(instruction);
      expect(context.structuredInput.status).toBe('unavailable');
      expect(context.reasonCode).toBe('BLOCKED_ROOM');
      const result = await generateExplanation(unavailable, 0);
      expect(result.reasonCode).toBe('BLOCKED_ROOM');
      expect(result.explanation).toContain('Closed for maintenance');
    }
  });

  it('does not invent details when information is missing, and stays concise and respectful', async () => {
    const result = await generateExplanation({ status: 'unavailable' }, 0);
    expect(result.explanation).not.toContain('undefined');
    expect(result.explanation).not.toContain('NaN');
    expect(result.explanation.length).toBeLessThan(300);
  });
});
