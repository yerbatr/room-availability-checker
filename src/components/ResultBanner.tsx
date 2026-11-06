import { CheckCircle, XCircle } from 'lucide-react';
import type { AvailabilityResult } from '@/lib/bookingRules';

export function ResultBanner({ status, message }: { status: AvailabilityResult['status']; message: string }) {
  const available = status === 'available';

  return (
    <div
      className={`rounded-xl p-4 flex items-start gap-3 ${
        available
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-red-50 border border-red-200'
      }`}
    >
      {available ? (
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className={`text-sm font-bold ${available ? 'text-emerald-800' : 'text-red-800'}`}>
          {available ? 'Available' : 'Unavailable'}
        </p>
        <p className={`text-xs mt-0.5 leading-relaxed ${available ? 'text-emerald-700' : 'text-red-700'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
