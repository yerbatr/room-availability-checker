
import { describe, expect, it } from 'vitest';
import {
  MAX_BOOKING_DURATION,
  evaluateAvailability,
  findConflict,
  getDurationHint,
  isDurationWithinLimit,
  minutesToTime,
  overlaps,
  timeToMinutes,
  validateBookingRequest,
  type Booking,
  type RoomSchedule,
} from '@/lib/bookingRules';

const CURRENT_TIME = 8 * 60 + 30;

const bookings: Booking[] = [
  { start: 480, end: 600, label: 'CS301 Algorithms' },
  { start: 660, end: 780, label: 'MATH202 Calculus' },
];

const openRoom: RoomSchedule = {
  name: 'Seminar Room 204',
  blocked: false,
  bookings,
};

const blockedRoom: RoomSchedule = {
  name: 'Computer Lab 3',
  blocked: true,
  blockedReason: 'Under scheduled maintenance until further notice',
  bookings: [],
};

const validRequest = { roomSelected: true, startTime: '09:00', endTime: '10:00' };

const MSG = {
  room: 'Please select a room to check.',
  startRequired: 'Start time is required.',
  endRequired: 'End time is required.',
  startRange: 'Start time must be between 00:00 and 24:00.',
  startCurrent: 'Start time must be after the current time (08:30).',
  endRange: 'End time must be between 00:00 and 24:00.',
  endBeforeStart: 'End time must be after start time.',
  tooLong: 'Bookings cannot exceed 2 hours (120 minutes).',
};

describe('time conversion', () => {
  it('converts HH:MM strings to minutes from midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes('24:00')).toBe(1440);
  });

  it.each(['12', 'abc', '', '25:99', '24:01', '12:60'])(
    'rejects malformed time input: %s',
    (time) => {
      expect(() => timeToMinutes(time)).toThrow(
        'Invalid time format. Expected HH:MM.'
      );
    }
  );

  it('formats minutes as zero-padded HH:MM', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(65)).toBe('01:05');
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('round-trips minutes through both helpers', () => {
    for (const minutes of [0, 59, 60, 510, 1005, 1440]) {
      expect(timeToMinutes(minutesToTime(minutes))).toBe(minutes);
    }
  });
});

describe('overlaps', () => {
  const booking = bookings[0];

  it('detects a partial overlap at the start of the booking', () => {
    expect(overlaps(420, 540, booking)).toBe(true);
  });

  it('detects a partial overlap at the end of the booking', () => {
    expect(overlaps(540, 660, booking)).toBe(true);
  });

  it('detects an interval contained within the booking', () => {
    expect(overlaps(500, 550, booking)).toBe(true);
  });

  it('detects an interval that encloses the booking', () => {
    expect(overlaps(400, 700, booking)).toBe(true);
  });

  it('allows an interval that starts exactly when the booking ends', () => {
    expect(overlaps(600, 660, booking)).toBe(false);
  });

  it('allows an interval that ends exactly when the booking starts', () => {
    expect(overlaps(420, 480, booking)).toBe(false);
  });

  it('does not flag disjoint intervals', () => {
    expect(overlaps(610, 650, booking)).toBe(false);
  });
});

describe('isDurationWithinLimit', () => {
  it('accepts a positive duration within the limit', () => {
    expect(isDurationWithinLimit(540, 600)).toBe(true);
    expect(isDurationWithinLimit(0, 1)).toBe(true);
  });

  it('accepts a duration of exactly the maximum', () => {
    expect(isDurationWithinLimit(480, 480 + MAX_BOOKING_DURATION)).toBe(true);
  });

  it('rejects a duration one minute over the maximum', () => {
    expect(isDurationWithinLimit(480, 480 + MAX_BOOKING_DURATION + 1)).toBe(false);
  });

  it('rejects zero-length and reversed intervals', () => {
    expect(isDurationWithinLimit(600, 600)).toBe(false);
    expect(isDurationWithinLimit(600, 500)).toBe(false);
  });
});

describe('getDurationHint', () => {
  it('returns the duration for a valid interval', () => {
    expect(getDurationHint(540, 600)).toBe(60);
  });

  it('returns the duration for an interval of exactly the maximum', () => {
    expect(getDurationHint(480, 600)).toBe(MAX_BOOKING_DURATION);
  });

  it('returns null when the duration exceeds the limit, is zero, or is reversed', () => {
    expect(getDurationHint(480, 481 + MAX_BOOKING_DURATION)).toBeNull();
    expect(getDurationHint(600, 600)).toBeNull();
    expect(getDurationHint(600, 500)).toBeNull();
  });
});

describe('MAX_BOOKING_DURATION', () => {
  it('is 120 minutes', () => {
    expect(MAX_BOOKING_DURATION).toBe(120);
  });
});

describe('validateBookingRequest', () => {
  it('accepts a valid request', () => {
    expect(validateBookingRequest(validRequest, CURRENT_TIME)).toEqual([]);
  });

  it('requires a room to be selected', () => {
    expect(validateBookingRequest({ ...validRequest, roomSelected: false }, CURRENT_TIME)).toEqual([
      { field: 'general', message: MSG.room },
    ]);
  });

  it('requires a start time', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startRequired },
    ]);
  });

  it('requires an end time', () => {
    expect(validateBookingRequest({ ...validRequest, endTime: '' }, CURRENT_TIME)).toEqual([
      { field: 'end', message: MSG.endRequired },
    ]);
  });

  it('reports every missing field together', () => {
    const errors = validateBookingRequest(
      { roomSelected: false, startTime: '', endTime: '' },
      CURRENT_TIME
    );
    expect(errors.map(e => e.field)).toEqual(['general', 'start', 'end']);
  });

  it('rejects a start time equal to the current time', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '08:30' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startCurrent },
    ]);
  });

  it('rejects a start time before the current time', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '08:29' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startCurrent },
    ]);
  });

  it('accepts a start time one minute after the current time', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '08:31', endTime: '09:00' }, CURRENT_TIME)).toEqual([]);
  });

  it('reports midnight as before the current time, not as out of range', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '00:00', endTime: '00:30' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startCurrent },
    ]);
  });

  it('rejects start and end times outside the day', () => {
    expect(validateBookingRequest({ roomSelected: true, startTime: '25:00', endTime: '26:00' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startRange },
      { field: 'end', message: MSG.endRange },
    ]);
  });

  it('rejects a negative start time as out of range', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '-1:00' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startRange },
    ]);
  });

  it('accepts an end time of 24:00', () => {
    expect(validateBookingRequest({ roomSelected: true, startTime: '23:00', endTime: '24:00' }, CURRENT_TIME)).toEqual([]);
  });

  it('rejects an end time equal to the start time', () => {
    expect(validateBookingRequest({ ...validRequest, endTime: '09:00' }, CURRENT_TIME)).toEqual([
      { field: 'end', message: MSG.endBeforeStart },
    ]);
  });

  it('rejects an end time before the start time', () => {
    expect(validateBookingRequest({ ...validRequest, endTime: '08:45' }, CURRENT_TIME)).toEqual([
      { field: 'end', message: MSG.endBeforeStart },
    ]);
  });

  it('accepts a booking of exactly 120 minutes', () => {
    expect(validateBookingRequest({ ...validRequest, endTime: '11:00' }, CURRENT_TIME)).toEqual([]);
  });

  it('rejects a booking of 121 minutes', () => {
    expect(validateBookingRequest({ ...validRequest, endTime: '11:01' }, CURRENT_TIME)).toEqual([
      { field: 'end', message: MSG.tooLong },
    ]);
  });

  it('reports only the start-time error when the start is too early', () => {
    expect(validateBookingRequest({ ...validRequest, startTime: '08:00', endTime: '09:00' }, CURRENT_TIME)).toEqual([
      { field: 'start', message: MSG.startCurrent },
    ]);
  });
});

describe('findConflict', () => {
  it('returns undefined when there are no bookings', () => {
    expect(findConflict({ start: 540, end: 600 }, [])).toBeUndefined();
  });

  it('returns undefined for an interval that only touches a booking', () => {
    expect(findConflict({ start: 600, end: 660 }, bookings)).toBeUndefined();
  });

  it('returns the first overlapping booking', () => {
    expect(findConflict({ start: 500, end: 700 }, bookings)?.label).toBe('CS301 Algorithms');
  });
});

describe('evaluateAvailability', () => {
  it('reports a blocked room as unavailable with its reason', () => {
    expect(evaluateAvailability(blockedRoom, { start: 600, end: 660 })).toEqual({
      status: 'unavailable',
      message: 'This room is currently blocked. Under scheduled maintenance until further notice',
    });
  });

  it('reports a blocked room without a reason using the base message', () => {
    const room: RoomSchedule = { name: 'Lab', blocked: true, bookings: [] };
    expect(evaluateAvailability(room, { start: 600, end: 660 })).toEqual({
      status: 'unavailable',
      message: 'This room is currently blocked. ',
    });
  });

  it('checks blocked status before bookings', () => {
    const room: RoomSchedule = { ...blockedRoom, bookings };
    expect(evaluateAvailability(room, { start: 500, end: 540 }).message).toBe(
      'This room is currently blocked. Under scheduled maintenance until further notice'
    );
  });

  it('reports a positive overlap with the booking label and times', () => {
    expect(evaluateAvailability(openRoom, { start: 500, end: 540 })).toEqual({
      status: 'unavailable',
      message: 'This time slot overlaps with an existing booking: "CS301 Algorithms" (08:00 \u2013 10:00).',
    });
  });

  it('treats an interval that touches a booking endpoint as available', () => {
    expect(evaluateAvailability(openRoom, { start: 600, end: 660 })).toEqual({
      status: 'available',
      message: 'Seminar Room 204 is free from 10:00 to 11:00 \u2014 you\'re good to go!',
    });
  });

  it('reports a free interval as available with room name and times', () => {
    expect(evaluateAvailability(openRoom, { start: 840, end: 900 })).toEqual({
      status: 'available',
      message: 'Seminar Room 204 is free from 14:00 to 15:00 \u2014 you\'re good to go!',
    });
  });
});

describe('availability checks do not modify booking data', () => {
  it('leaves room and booking data unchanged after evaluating availability', () => {
    const snapshot = structuredClone(openRoom);

    evaluateAvailability(openRoom, { start: 500, end: 540 });
    evaluateAvailability(openRoom, { start: 600, end: 660 });
    findConflict({ start: 500, end: 700 }, openRoom.bookings);

    expect(openRoom).toEqual(snapshot);
  });

  it('returns the same result when called repeatedly with the same input', () => {
    const first = evaluateAvailability(openRoom, { start: 840, end: 900 });
    const second = evaluateAvailability(openRoom, { start: 840, end: 900 });
    expect(second).toEqual(first);
  });
});
