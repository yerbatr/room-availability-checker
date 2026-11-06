import { minutesToTime, type AvailabilityResult, type Booking } from '@/lib/bookingRules';

export function DayTimeline({
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
  checkResult: AvailabilityResult['status'] | null;
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
