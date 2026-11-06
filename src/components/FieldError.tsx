import { AlertCircle } from 'lucide-react';

export function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
      {message}
    </p>
  );
}
