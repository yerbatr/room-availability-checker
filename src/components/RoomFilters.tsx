import { Check, SlidersHorizontal } from 'lucide-react';
import type { EquipmentItem } from '@/data/rooms';
import { FieldError } from '@/components/FieldError';
import { FIELD_LABEL_CLASS, fieldInputClass } from '@/components/formStyles';

interface RoomFiltersProps {
  attendeesInput: string;
  attendeesError: string | null;
  equipmentOptions: readonly EquipmentItem[];
  selectedEquipment: EquipmentItem[];
  matchCount: number;
  totalCount: number;
  onAttendeesChange: (value: string) => void;
  onToggleEquipment: (item: EquipmentItem) => void;
  onClear: () => void;
}

export function RoomFilters({
  attendeesInput,
  attendeesError,
  equipmentOptions,
  selectedEquipment,
  matchCount,
  totalCount,
  onAttendeesChange,
  onToggleEquipment,
  onClear,
}: RoomFiltersProps) {
  const hasActiveFilters = attendeesInput.trim() !== '' || selectedEquipment.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Requirements
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div>
        <label htmlFor="attendees" className={FIELD_LABEL_CLASS}>
          Attendees
        </label>
        <input
          id="attendees"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="Any"
          value={attendeesInput}
          onChange={e => onAttendeesChange(e.target.value)}
          className={`${fieldInputClass(Boolean(attendeesError))} placeholder:text-slate-400`}
        />
        {attendeesError && <FieldError message={attendeesError} />}
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>Equipment needed</p>
        <div className="flex flex-wrap gap-2">
          {equipmentOptions.map(item => {
            const pressed = selectedEquipment.includes(item);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={pressed}
                onClick={() => onToggleEquipment(item)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  pressed
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {pressed && <Check className="w-3 h-3" />}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{matchCount}</span> of {totalCount} rooms
      </p>
    </div>
  );
}
