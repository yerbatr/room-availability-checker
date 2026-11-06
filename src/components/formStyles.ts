export const FIELD_LABEL_CLASS = 'block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5';

export function fieldInputClass(hasError: boolean): string {
  return `w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${hasError ? 'border-red-400' : 'border-slate-200'}`;
}
