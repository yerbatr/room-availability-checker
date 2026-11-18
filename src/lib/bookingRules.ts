export const MAX_BOOKING_DURATION = 120;

const MINUTES_PER_DAY = 1440;

export interface Booking {
  start: number;
  end: number;
  label: string;
}

export interface RoomSchedule {
  name: string;
  blocked: boolean;
  blockedReason?: string;
  bookings: Booking[];
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface BookingRequest {
  roomSelected: boolean;
  startTime: string;
  endTime: string;
}

export interface ValidationError {
  field: 'start' | 'end' | 'general';
  message: string;
}

export interface AvailabilityResult {
  status: 'available' | 'unavailable';
  message: string;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// export function timeToMinutes(time: string): number {
//   const [h, m] = time.split(':').map(Number);
//   return h * 60 + m;
// }

export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-4]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new Error('Invalid time format. Expected HH:MM.');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  // 24:00 is valid, but 24:01 and later are not.
  if (hours === 24 && minutes !== 0) {
    throw new Error('Invalid time format. Expected HH:MM.');
  }

  return hours * 60 + minutes;
}

export function overlaps(start: number, end: number, booking: Booking): boolean {
  return start < booking.end && end > booking.start;
}

export function isDurationWithinLimit(start: number, end: number): boolean {
  const duration = end - start;
  return duration > 0 && duration <= MAX_BOOKING_DURATION;
}

export function getDurationHint(start: number, end: number): number | null {
  return isDurationWithinLimit(start, end) ? end - start : null;
}

export function validateBookingRequest(request: BookingRequest, currentTime: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!request.roomSelected) {
    errors.push({ field: 'general', message: 'Please select a room to check.' });
  }

  let startMins = -1;
  if (request.startTime) {
    try {
      startMins = timeToMinutes(request.startTime);
    } catch {
      startMins = -1;
    }
  }

  let endMins = -1;
  if (request.endTime) {
    try {
      endMins = timeToMinutes(request.endTime);
    } catch {
      endMins = -1;
    }
  }

  if (!request.startTime) {
    errors.push({ field: 'start', message: 'Start time is required.' });
  } else if (startMins < 0 || startMins > MINUTES_PER_DAY) {
    errors.push({ field: 'start', message: 'Start time must be between 00:00 and 24:00.' });
  } else if (startMins <= currentTime) {
    errors.push({ field: 'start', message: `Start time must be after the current time (${minutesToTime(currentTime)}).` });
  }

  if (!request.endTime) {
    errors.push({ field: 'end', message: 'End time is required.' });
  } else if (endMins < 0 || endMins > MINUTES_PER_DAY) {
    errors.push({ field: 'end', message: 'End time must be between 00:00 and 24:00.' });
  }

  if (request.startTime && request.endTime && startMins >= 0 && endMins >= 0) {
    if (endMins <= startMins) {
      errors.push({ field: 'end', message: 'End time must be after start time.' });
    } else if (endMins - startMins > MAX_BOOKING_DURATION) {
      errors.push({ field: 'end', message: `Bookings cannot exceed ${MAX_BOOKING_DURATION / 60} hours (${MAX_BOOKING_DURATION} minutes).` });
    }
  }

  return errors;
}

export function findConflict(range: TimeRange, bookings: Booking[]): Booking | undefined {
  return bookings.find(b => overlaps(range.start, range.end, b));
}

export function evaluateAvailability(room: RoomSchedule, range: TimeRange): AvailabilityResult {
  if (room.blocked) {
    return { status: 'unavailable', message: `This room is currently blocked. ${room.blockedReason ?? ''}` };
  }

  const conflict = findConflict(range, room.bookings);
  if (conflict) {
    return {
      status: 'unavailable',
      message: `This time slot overlaps with an existing booking: "${conflict.label}" (${minutesToTime(conflict.start)} – ${minutesToTime(conflict.end)}).`,
    };
  }

  return {
    status: 'available',
    message: `${room.name} is free from ${minutesToTime(range.start)} to ${minutesToTime(range.end)} — you're good to go!`,
  };
}
