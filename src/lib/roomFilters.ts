import type { EquipmentItem } from '@/data/rooms';

export interface RoomFilters {
  attendees: number | null;
  equipment: EquipmentItem[];
}

interface FilterableRoom {
  capacity: number;
  equipment: readonly EquipmentItem[];
}

export function filterRooms<T extends FilterableRoom>(rooms: T[], filters: RoomFilters): T[] {
  return rooms.filter(
    room =>
      (filters.attendees === null || room.capacity >= filters.attendees) &&
      filters.equipment.every(item => room.equipment.includes(item))
  );
}

export function keepSelectedRoomId(selectedRoomId: string, visibleRooms: { id: string }[]): string {
  return visibleRooms.some(room => room.id === selectedRoomId) ? selectedRoomId : '';
}

export function parseAttendees(input: string): { value: number | null; error: string | null } {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { value: null, error: null };
  }

  const count = Number(trimmed);
  if (!Number.isInteger(count) || count < 1) {
    return { value: null, error: 'Enter a whole number of at least 1 to filter by capacity.' };
  }

  return { value: count, error: null };
}
