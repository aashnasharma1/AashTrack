import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: { current: number; max: number };
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, charCount, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && (
              <span className="ml-0.5 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-9 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
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
              id={`${inputId}-error`}
              role="alert"
              className="text-xs text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
          {!error && hint && (
            <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
              {hint}
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

Input.displayName = 'Input';
