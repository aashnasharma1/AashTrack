import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          rows={3}
          className={cn(
            'w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            'transition-colors dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600',
            error
              ? 'border-red-400 focus:ring-red-400 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-700',
            className,
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-2">
          {error && (
            <p
              id={`${textareaId}-error`}
              role="alert"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
          {charCount && (
            <p
              className={cn(
                'ml-auto text-xs',
                charCount.current > charCount.max * 0.9
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-400 dark:text-gray-600',
              )}
            >
              {charCount.current}/{charCount.max}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
