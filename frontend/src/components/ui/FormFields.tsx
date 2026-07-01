import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'input-field',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/10',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[var(--color-text-secondary)]">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

interface PasswordInputProps extends Omit<InputProps, 'type'> {}

export function PasswordInput({ label = 'Password', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={props.id ?? 'password'} className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={props.id ?? 'password'}
          type={visible ? 'text' : 'password'}
          className={cn('input-field pr-11', props.error && 'border-red-400')}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {props.error && <p className="text-xs font-medium text-red-600">{props.error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, children, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}
      <select id={selectId} className={cn('input-field', className)} {...props}>
        {children}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
