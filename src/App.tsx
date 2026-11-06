import { useState } from 'react';
import { AlertCircle, Building2, ChevronDown, Clock, MapPin, SearchX, Users } from 'lucide-react';
import {
  evaluateAvailability,
  getDurationHint,
  minutesToTime,
  timeToMinutes,
  validateBookingRequest,
  type ValidationError,
} from '@/lib/bookingRules';
import { EQUIPMENT_OPTIONS, ROOMS, type EquipmentItem } from '@/data/rooms';
import { filterRooms, keepSelectedRoomId, parseAttendees } from '@/lib/roomFilters';
import { DayTimeline } from '@/components/DayTimeline';
import { EmptyState } from '@/components/EmptyState';
import { FieldError } from '@/components/FieldError';
import { FIELD_LABEL_CLASS, fieldInputClass } from '@/components/formStyles';
import { ResultBanner } from '@/components/ResultBanner';
import { RoomFilters } from '@/components/RoomFilters';

const CURRENT_TIME = 8 * 60 + 30; // 08:30

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');
  const [requiredEquipment, setRequiredEquipment] = useState<EquipmentItem[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [checked, setChecked] = useState(false);

  const attendees = parseAttendees(attendeesInput);
  const visibleRooms = filterRooms(ROOMS, { attendees: attendees.value, equipment: requiredEquipment });
  const selectedRoom = visibleRooms.find(r => r.id === selectedRoomId) ?? null;

  const startMinutes = startTime ? timeToMinutes(startTime) : null;
  const endMinutes = endTime ? timeToMinutes(endTime) : null;
  const durationHint = startMinutes !== null && endMinutes !== null
    ? getDurationHint(startMinutes, endMinutes)
    : null;

  const outcome = checked && selectedRoom && startMinutes !== null && endMinutes !== null
    ? evaluateAvailability(selectedRoom, { start: startMinutes, end: endMinutes })
    : null;

  const roomError = errors.find(e => e.field === 'general')?.message ?? null;
  const startError = errors.find(e => e.field === 'start')?.message ?? null;
  const endError = errors.find(e => e.field === 'end')?.message ?? null;

  function applyFilters(nextAttendees: string, nextEquipment: EquipmentItem[]) {
    const nextVisible = filterRooms(ROOMS, {
      attendees: parseAttendees(nextAttendees).value,
      equipment: nextEquipment,
    });
    setSelectedRoomId(keepSelectedRoomId(selectedRoomId, nextVisible));
    setAttendeesInput(nextAttendees);
    setRequiredEquipment(nextEquipment);
  }

  function handleToggleEquipment(item: EquipmentItem) {
    const next = requiredEquipment.includes(item)
      ? requiredEquipment.filter(i => i !== item)
      : [...requiredEquipment, item];
    applyFilters(attendeesInput, next);
  }

  function handleClearFilters() {
    applyFilters('', []);
  }

  function handleCheck() {
    const newErrors = validateBookingRequest(
      { roomSelected: Boolean(selectedRoom), startTime, endTime },
      CURRENT_TIME
    );
    setErrors(newErrors);
    setChecked(newErrors.length === 0);
  }

  function handleReset() {
    setSelectedRoomId('');
    setStartTime('');
    setEndTime('');
    setAttendeesInput('');
    setRequiredEquipment([]);
    setErrors([]);
    setChecked(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 leading-tight">
              Smart Campus Room Availability
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Current time: <span className="font-medium text-slate-700">{minutesToTime(CURRENT_TIME)}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 items-start">
        {/* Checker Panel */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
          <div className="bg-blue-600 px-5 py-4">
            <h2 className="text-white font-semibold text-sm tracking-wide uppercase">Check Availability</h2>
            <p className="text-blue-200 text-xs mt-0.5">Select a room and enter a time interval</p>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            <RoomFilters
              attendeesInput={attendeesInput}
              attendeesError={attendees.error}
              equipmentOptions={EQUIPMENT_OPTIONS}
              selectedEquipment={requiredEquipment}
              matchCount={visibleRooms.length}
              totalCount={ROOMS.length}
              onAttendeesChange={value => applyFilters(value, requiredEquipment)}
              onToggleEquipment={handleToggleEquipment}
              onClear={handleClearFilters}
            />

            {/* Room selector */}
            <div>
              <label className={FIELD_LABEL_CLASS}>
                Room
              </label>
              <div className="relative">
                <select
                  value={selectedRoomId}
                  disabled={visibleRooms.length === 0}
                  onChange={e => { setSelectedRoomId(e.target.value); setErrors([]); }}
                  className={`${fieldInputClass(Boolean(roomError))} appearance-none pr-8`}
                >
                  <option value="">{visibleRooms.length === 0 ? '-- No matching rooms --' : '-- Select a room --'}</option>
                  {visibleRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.blocked ? '(Blocked)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {roomError && <FieldError message={roomError} />}
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className={FIELD_LABEL_CLASS}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setChecked(false); setErrors([]); }}
                  className={fieldInputClass(Boolean(startError))}
                />
                {startError && <FieldError message={startError} />}
              </div>
              <div className="min-w-0">
                <label className={FIELD_LABEL_CLASS}>
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setChecked(false); setErrors([]); }}
                  className={fieldInputClass(Boolean(endError))}
                />
                {endError && <FieldError message={endError} />}
              </div>
            </div>

            {/* Duration hint */}
            {durationHint !== null && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <Clock className="w-3 h-3 text-slate-400" />
                Duration: <span className="font-medium text-slate-700">{durationHint} min</span>
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCheck}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
              >
                Check Availability
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-sm transition-colors border border-slate-200"
              >
                Reset
              </button>
            </div>

            {/* Result */}
            {outcome && <ResultBanner status={outcome.status} message={outcome.message} />}
          </div>
        </section>

        {/* Room Details Panel */}
        <section className="lg:col-span-3 space-y-4 min-w-0">
          {selectedRoom ? (
            <>
              {/* Room info card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{selectedRoom.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedRoom.building}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                      <Users className="w-3 h-3" />
                      Capacity: {selectedRoom.capacity}
                    </span>
                    {selectedRoom.blocked ? (
                      <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                {selectedRoom.blocked && selectedRoom.blockedReason && (
                  <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {selectedRoom.blockedReason}
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
                  Today's Schedule
                </h4>
                <DayTimeline
                  bookings={selectedRoom.bookings}
                  currentTime={CURRENT_TIME}
                  checkStart={checked ? startMinutes : null}
                  checkEnd={checked ? endMinutes : null}
                  checkResult={outcome?.status ?? null}
                />
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Existing booking
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Your slot (available)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Your slot (conflict)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-0.5 h-3 bg-amber-500 inline-block" /> Current time
                  </span>
                </div>
              </div>

              {/* Booking list */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  Booked Slots
                </h4>
                {selectedRoom.bookings.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No bookings today.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedRoom.bookings.map((b, i) => (
                      <li key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                        <span className="text-sm text-slate-700 font-medium">{b.label}</span>
                        <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 rounded-md px-2 py-0.5 ml-2 flex-shrink-0">
                          {minutesToTime(b.start)} – {minutesToTime(b.end)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : visibleRooms.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No rooms match your requirements"
              description="Try a lower attendee count or fewer equipment items."
              action={
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No room selected"
              description="Choose a room from the list to see its schedule and check availability."
            />
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        Smart Campus &mdash; Room Availability Prototype &mdash; Data is fictional and for demonstration only
      </footer>
    </div>
  );
}
