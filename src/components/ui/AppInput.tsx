import React from 'react';

interface AppInputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  [key: string]: any;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  placeholder,
  icon,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
  ...rest
}) => {

  return (
    <div className="w-full min-w-[200px] relative">
      {label && (
        <label className="block mb-2 text-sm text-text-primary font-medium">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type={type}
          className="peer relative z-10 border-2 border-border h-12 w-full rounded-lg bg-surface px-4 py-3 font-medium outline-none ring-0 focus:outline-none focus:ring-0 shadow-adaptive-sm transition-all duration-200 ease-in-out focus:shadow-adaptive-xl focus:shadow-interactive/30 placeholder:font-normal text-text-primary placeholder:text-text-muted hover:shadow-adaptive hover:shadow-border/10"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...rest}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
