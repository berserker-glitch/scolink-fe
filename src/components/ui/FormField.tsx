import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-caption font-medium text-text-primary">
        {label}
        {required && <span className="text-status-error ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-caption text-status-error">{error}</p>
      )}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, className, ...props }) => {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 border rounded-lg bg-background text-text-primary focus-brutalist transition-colors',
        error ? 'border-status-error' : 'border-border',
        className
      )}
      {...props}
    />
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({ error, options, className, ...props }) => {
  return (
    <select
      className={cn(
        'w-full px-4 py-3 border rounded-lg bg-background text-text-primary focus-brutalist transition-colors',
        error ? 'border-status-error' : 'border-border',
        className
      )}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ error, className, ...props }) => {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 border rounded-lg bg-background text-text-primary focus-brutalist transition-colors resize-vertical min-h-[100px]',
        error ? 'border-status-error' : 'border-border',
        className
      )}
      {...props}
    />
  );
};