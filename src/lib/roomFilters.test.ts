import { describe, expect, it } from 'vitest';
import { ROOMS } from '@/data/rooms';
import { evaluateAvailability } from '@/lib/bookingRules';
import { filterRooms, parseAttendees } from '@/lib/roomFilters';

const NO_FILTERS = { attendees: null, equipment: [] };

const idsOf = (rooms: { id: string }[]) => rooms.map(r => r.id).sort();

describe('filterRooms', () => {
  it('returns every room when no filters are set', () => {
    expect(filterRooms(ROOMS, NO_FILTERS)).toHaveLength(ROOMS.length);
  });

  it('includes a room whose capacity equals the requested attendees', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: 30, equipment: [] }))).toContain('SR204');
  });

  it('excludes rooms whose capacity is below the requested attendees', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: 31, equipment: [] }))).not.toContain('SR204');
  });

  it('keeps only rooms that can seat the requested attendees', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: 100, equipment: [] }))).toEqual(['LT101']);
  });

  it('requires every selected equipment item', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: null, equipment: ['Projector', 'Whiteboard'] })))
      .toEqual(['LAB3', 'LT101', 'SR204']);
  });

  it('returns no rooms when no room has all selected equipment', () => {
    expect(filterRooms(ROOMS, { attendees: null, equipment: ['Lab Workstations', 'Video Conferencing'] })).toEqual([]);
  });

  it('applies capacity and equipment filters together', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: 20, equipment: ['Projector', 'Sound System'] })))
      .toEqual(['LT101', 'STU1']);
  });

  it('keeps blocked rooms that match the filters', () => {
    expect(idsOf(filterRooms(ROOMS, { attendees: 40, equipment: ['Lab Workstations'] }))).toEqual(['LAB3']);
  });

  it('does not mutate the input room list', () => {
    const snapshot = structuredClone(ROOMS);
    filterRooms(ROOMS, { attendees: 50, equipment: ['Projector'] });
    expect(ROOMS).toEqual(snapshot);
  });
});

describe('blocked rooms that match filters', () => {
  it('are still reported as unavailable', () => {
    const [lab] = filterRooms(ROOMS, { attendees: 40, equipment: ['Lab Workstations'] });
    const result = evaluateAvailability(lab, { start: 900, end: 960 });
    expect(result.status).toBe('unavailable');
  });
});

describe('parseAttendees', () => {
  it('treats an empty field as no capacity filter', () => {
    expect(parseAttendees('')).toEqual({ value: null, error: null });
    expect(parseAttendees('   ')).toEqual({ value: null, error: null });
  });

  it('accepts whole numbers of at least 1', () => {
    expect(parseAttendees('1')).toEqual({ value: 1, error: null });
    expect(parseAttendees(' 12 ')).toEqual({ value: 12, error: null });
  });

  it('rejects zero, negative, fractional, and non-numeric input', () => {
    for (const input of ['0', '-3', '2.5', 'abc']) {
      expect(parseAttendees(input).value).toBeNull();
      expect(parseAttendees(input).error).toBe('Enter a whole number of at least 1 to filter by capacity.');
    }
  });
});
