import { useState } from 'react';
import { Building2, Clock, CheckCircle, XCircle, AlertCircle, MapPin, Users, ChevronDown } from 'lucide-react';
import {
  evaluateAvailability,
  isDurationWithinLimit,
  minutesToTime,
  timeToMinutes,
  validateBookingRequest,
  type Booking,
  type RoomSchedule,
  type ValidationError,
} from '@/lib/bookingRules';

interface Room extends RoomSchedule {
  id: string;
  building: string;
  capacity: number;
}

const ROOMS: Room[] = [
  {
    id: 'LT101',
    name: 'Lecture Theatre 101',
    building: 'Engineering Block A',
    capacity: 120,
    blocked: false,
    bookings: [
      { start: 480, end: 600, label: 'CS301 Algorithms' },
      { start: 660, end: 780, label: 'MATH202 Calculus' },
      { start: 900, end: 960, label: 'CS410 Networks' },
    ],
  },
  {
    id: 'SR204',
    name: 'Seminar Room 204',
    building: 'Arts & Sciences Building',
    capacity: 30,
    blocked: false,
    bookings: [
      { start: 540, end: 600, label: 'Group Project Meeting' },
      { start: 720, end: 840, label: 'Philosophy Seminar' },
      { start: 1080, end: 1140, label: 'Research Discussion' },
    ],
  },
  {
    id: 'LAB3',
    name: 'Computer Lab 3',
    building: 'Technology Hub',
    capacity: 40,
    blocked: true,
    blockedReason: 'Under scheduled maintenance until further notice',
    bookings: [
      { start: 600, end: 720, label: 'Web Dev Workshop' },
    ],
  },
  {
    id: 'CR305',
    name: 'Conference Room 305',
    building: 'Administration Centre',
    capacity: 16,
    blocked: false,
    bookings: [
      { start: 480, end: 540, label: 'Faculty Meeting' },
      { start: 840, end: 960, label: 'Board Review' },
      { start: 1200, end: 1320, label: 'Annual Planning' },
    ],
  },
  {
    id: 'STU1',
    name: 'Studio Lab 1',
    building: 'Creative Arts Wing',
    capacity: 20,
    blocked: false,
    bookings: [
      { start: 570, end: 690, label: 'Design Workshop' },
      { start: 780, end: 900, label: 'Media Production' },
    ],
  },
];

const CURRENT_TIME = 8 * 60 + 30; // 08:30

type ResultType = 'available' | 'unavailable' | null;

export default function App() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [result, setResult] = useState<ResultType>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [checked, setChecked] = useState(false);

  const selectedRoom = ROOMS.find(r => r.id === selectedRoomId) ?? null;

  const getError = (field: ValidationError['field']) =>
    errors.find(e => e.field === field)?.message ?? null;

  function handleCheck() {
    setResult(null);
    setChecked(false);

    const newErrors = validateBookingRequest(
      { roomSelected: Boolean(selectedRoomId), startTime, endTime },
      CURRENT_TIME
    );
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setChecked(true);

    const room = ROOMS.find(r => r.id === selectedRoomId)!;
    const outcome = evaluateAvailability(room, {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    });
    setResult(outcome.status);
    setResultMessage(outcome.message);
  }

  function handleReset() {
    setSelectedRoomId('');
    setStartTime('');
    setEndTime('');
    setResult(null);
    setResultMessage('');
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
            {/* Room selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Room
              </label>
              <div className="relative">
                <select
                  value={selectedRoomId}
                  onChange={e => { setSelectedRoomId(e.target.value); setChecked(false); setResult(null); setErrors([]); }}
                  className={`w-full appearance-none bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${getError('general') ? 'border-red-400' : 'border-slate-200'}`}
                >
                  <option value="">-- Select a room --</option>
                  {ROOMS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.blocked ? '(Blocked)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {getError('general') && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {getError('general')}
                </p>
              )}
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setChecked(false); setResult(null); setErrors([]); }}
                  className={`w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${getError('start') ? 'border-red-400' : 'border-slate-200'}`}
                />
                {getError('start') && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {getError('start')}
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setChecked(false); setResult(null); setErrors([]); }}
                  className={`w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${getError('end') ? 'border-red-400' : 'border-slate-200'}`}
                />
                {getError('end') && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    {getError('end')}
                  </p>
                )}
              </div>
            </div>

            {/* Duration hint */}
            {startTime && endTime && (() => {
              const s = timeToMinutes(startTime);
              const e = timeToMinutes(endTime);
              const dur = e - s;
              if (isDurationWithinLimit(s, e)) {
                return (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Duration: <span className="font-medium text-slate-700">{dur} min</span>
                  </p>
                );
              }
              return null;
            })()}

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
            {checked && result && (
              <div
                className={`rounded-xl p-4 flex items-start gap-3 ${
                  result === 'available'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result === 'available' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-bold ${result === 'available' ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result === 'available' ? 'Available' : 'Unavailable'}
                  </p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${result === 'available' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {resultMessage}
                  </p>
                </div>
              </div>
            )}
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
                  checkStart={checked && startTime ? timeToMinutes(startTime) : null}
                  checkEnd={checked && endTime ? timeToMinutes(endTime) : null}
                  checkResult={result}
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
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center min-h-64">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Building2 className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium text-sm">No room selected</p>
              <p className="text-slate-400 text-xs mt-1">Choose a room from the list to see its schedule and check availability.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-400">
        Smart Campus &mdash; Room Availability Prototype &mdash; Data is fictional and for demonstration only
      </footer>
    </div>
  );
}

function DayTimeline({
  bookings,
  currentTime,
  checkStart,
  checkEnd,
  checkResult,
}: {
  bookings: Booking[];
  currentTime: number;
  checkStart: number | null;
  checkEnd: number | null;
  checkResult: ResultType;
}) {
  const DAY_START = 7 * 60;  // 07:00
  const DAY_END = 22 * 60;   // 22:00
  const SPAN = DAY_END - DAY_START;

  const toPercent = (m: number) => Math.max(0, Math.min(100, ((m - DAY_START) / SPAN) * 100));

  const labelTransform = (m: number) => {
    const pct = toPercent(m);
    if (pct <= 0) return '';
    if (pct >= 100) return '-translate-x-full';
    return '-translate-x-1/2';
  };

  const hourMarkers: number[] = [];
  for (let h = 7; h <= 22; h++) hourMarkers.push(h * 60);

  return (
    <div className="relative overflow-hidden">
      {/* Hour labels */}
      <div className="relative h-5 mb-1">
        {hourMarkers.filter((_, i) => i % 2 === 0).map(m => (
          <span
            key={m}
            className={`absolute text-[10px] text-slate-400 ${labelTransform(m)}`}
            style={{ left: `${toPercent(m)}%` }}
          >
            {minutesToTime(m)}
          </span>
        ))}
      </div>

      {/* Bar */}
      <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
        {/* Existing bookings */}
        {bookings.map((b, i) => (
          <div
            key={i}
            title={`${b.label}: ${minutesToTime(b.start)}–${minutesToTime(b.end)}`}
            className="absolute top-0 h-full bg-blue-400 opacity-90 rounded-sm overflow-hidden"
            style={{
              left: `${toPercent(b.start)}%`,
              width: `${toPercent(b.end) - toPercent(b.start)}%`,
            }}
          />
        ))}

        {/* Checked interval */}
        {checkStart !== null && checkEnd !== null && checkResult && (
          <div
            className={`absolute top-0 h-full opacity-80 ${checkResult === 'available' ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{
              left: `${toPercent(checkStart)}%`,
              width: `${toPercent(checkEnd) - toPercent(checkStart)}%`,
            }}
          />
        )}

        {/* Current time line */}
        {currentTime >= DAY_START && currentTime <= DAY_END && (
          <div
            className="absolute top-0 h-full w-0.5 bg-amber-500 z-10"
            style={{ left: `${toPercent(currentTime)}%` }}
          />
        )}
      </div>

      {/* Bottom labels */}
      <div className="relative h-5 mt-1">
        {hourMarkers.filter((_, i) => i % 2 === 1).map(m => (
          <span
            key={m}
            className={`absolute text-[10px] text-slate-400 ${labelTransform(m)}`}
            style={{ left: `${toPercent(m)}%` }}
          >
            {minutesToTime(m)}
          </span>
        ))}
      </div>
    </div>
  );
}
