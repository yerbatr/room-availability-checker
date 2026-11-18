import { minutesToTime } from '@/lib/bookingRules';
import { SYSTEM_INSTRUCTION } from '@/lib/explanationPrompts';

export type ExplanationReasonCode =
  | 'AVAILABLE'
  | 'BOOKING_CONFLICT'
  | 'BLOCKED_ROOM'
  | 'INVALID_REQUEST'
  | 'UNKNOWN';

export interface ConflictInfo {
  label?: string;
  start?: number;
  end?: number;
}

export interface ExplanationError {
  field: string;
  message: string;
}

export interface ExplanationInput {
  roomId?: string;
  roomName?: string;
  status?: 'available' | 'unavailable';
  startMinutes?: number;
  endMinutes?: number;
  blocked?: boolean;
  blockedReason?: string | null;
  conflict?: ConflictInfo | null;
  validationErrors?: ExplanationError[];
}

export interface ExplanationResult {
  reasonCode: ExplanationReasonCode;
  explanation: string;
}

export interface ExplanationContext {
  systemInstruction: string;
  structuredInput: ExplanationInput;
  reasonCode: ExplanationReasonCode;
}

export function buildExplanationContext(
  input: ExplanationInput,
  systemInstruction: string = SYSTEM_INSTRUCTION
): ExplanationContext {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Explanation adapter failure: invalid structured payload.');
  }
  return {
    systemInstruction,
    structuredInput: input,
    reasonCode: classifyReason(input),
  };
}

export const EXPLANATION_FALLBACK_MESSAGE =
  'The explanation service is temporarily unavailable. The availability result shown above remains accurate.';

const DEFAULT_DELAY_MS = 250;

export function classifyReason(input: ExplanationInput): ExplanationReasonCode {
  if (Array.isArray(input.validationErrors) && input.validationErrors.length > 0) {
    return 'INVALID_REQUEST';
  }

  if (input.status === 'available') {
    return 'AVAILABLE';
  }

  if (input.status === 'unavailable') {
    if (input.blocked === true || (input.blockedReason ?? null) !== null) {
      return 'BLOCKED_ROOM';
    }
    if (input.conflict) {
      return 'BOOKING_CONFLICT';
    }
  }

  return 'UNKNOWN';
}

function roomDisplayName(input: ExplanationInput): string {
  const name = typeof input.roomName === 'string' ? input.roomName.trim() : '';
  return name !== '' ? name : 'This room';
}

function formatInterval(start?: number, end?: number): string | null {
  if (typeof start !== 'number' || typeof end !== 'number') {
    return null;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  return `from ${minutesToTime(start)} to ${minutesToTime(end)}`;
}

function describeConflict(input: ExplanationInput): string {
  const name = roomDisplayName(input);
  const conflict = input.conflict ?? {};
  const label = typeof conflict.label === 'string' ? conflict.label.trim() : '';
  const hasTimes =
    typeof conflict.start === 'number' &&
    typeof conflict.end === 'number' &&
    Number.isFinite(conflict.start) &&
    Number.isFinite(conflict.end);

  if (label !== '' && hasTimes) {
    return `${name} is unavailable because the requested interval overlaps the existing booking "${label}" (${minutesToTime(conflict.start as number)} \u2013 ${minutesToTime(conflict.end as number)}). Try choosing a different time.`;
  }
  if (label !== '') {
    return `${name} is unavailable because it overlaps the existing booking "${label}". Try choosing a different time.`;
  }
  if (hasTimes) {
    return `${name} is unavailable because it overlaps an existing booking from ${minutesToTime(conflict.start as number)} to ${minutesToTime(conflict.end as number)}. Try choosing a different time.`;
  }
  return `${name} is unavailable because it overlaps an existing booking. Try choosing a different time.`;
}

function buildExplanation(input: ExplanationInput, reasonCode: ExplanationReasonCode): string {
  switch (reasonCode) {
    case 'AVAILABLE': {
      const name = roomDisplayName(input);
      const interval = formatInterval(input.startMinutes, input.endMinutes);
      return interval !== null
        ? `${name} is available ${interval}. You can go ahead and book this slot.`
        : `${name} is available for the requested time.`;
    }
    case 'BOOKING_CONFLICT':
      return describeConflict(input);
    case 'BLOCKED_ROOM': {
      const name = roomDisplayName(input);
      const reason = typeof input.blockedReason === 'string' ? input.blockedReason.trim() : '';
      return reason !== ''
        ? `${name} is currently unavailable: ${reason} The room cannot be booked at this time.`
        : `${name} is currently unavailable because the room is blocked.`;
    }
    case 'INVALID_REQUEST': {
      const messages = Array.isArray(input.validationErrors)
        ? input.validationErrors.map(e => (typeof e?.message === 'string' ? e.message.trim() : '')).filter(Boolean)
        : [];
      return messages.length > 0
        ? `This booking request could not be checked: ${messages.join(' ')}`
        : 'This booking request is incomplete. Please select a room and valid start and end times.';
    }
    case 'UNKNOWN':
    default:
      return 'No explanation is available for this result. The availability status shown above is authoritative.';
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateExplanation(
  input: ExplanationInput,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<ExplanationResult> {
  const context = buildExplanationContext(input);

  await wait(delayMs);

  return { reasonCode: context.reasonCode, explanation: buildExplanation(input, context.reasonCode) };
}
