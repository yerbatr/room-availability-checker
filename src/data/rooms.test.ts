import { describe, expect, it } from 'vitest';
import { EQUIPMENT_OPTIONS, ROOMS } from '@/data/rooms';
import { evaluateAvailability, findConflict } from '@/lib/bookingRules';

describe('room catalog', () => {
  it('contains at least four rooms', () => {
    expect(ROOMS.length).toBeGreaterThanOrEqual(4);
  });

  it('gives every room a unique ID', () => {
    const ids = ROOMS.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every room a positive whole-number capacity', () => {
    for (const room of ROOMS) {
      expect(Number.isInteger(room.capacity) && room.capacity > 0).toBe(true);
    }
  });

  it('uses only known equipment items, without duplicates', () => {
    for (const room of ROOMS) {
      expect(new Set(room.equipment).size).toBe(room.equipment.length);
      for (const item of room.equipment) {
        expect(EQUIPMENT_OPTIONS).toContain(item);
      }
    }
  });

  it('keeps each room\u2019s bookings valid and non-overlapping', () => {
    for (const room of ROOMS) {
      const sorted = [...room.bookings].sort((a, b) => a.start - b.start);
      for (const booking of sorted) {
        expect(booking.start).toBeGreaterThanOrEqual(0);
        expect(booking.end).toBeLessThanOrEqual(1440);
        expect(booking.start).toBeLessThan(booking.end);
      }
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end);
      }
    }
  });
});

describe('availability uses the selected room only', () => {
  const conference = ROOMS.find(r => r.id === 'CR305')!;
  const lecture = ROOMS.find(r => r.id === 'LT101')!;
  const slot = { start: 540, end: 600 };

  it('ignores another room\u2019s booking for the same time', () => {
    expect(findConflict(slot, lecture.bookings)?.label).toBe('CS301 Algorithms');
    expect(findConflict(slot, conference.bookings)).toBeUndefined();
    expect(evaluateAvailability(conference, slot).status).toBe('available');
  });
});
