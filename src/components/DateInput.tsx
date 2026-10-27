import React from 'react';
import { formatDateDDMMYYYY } from '../utils/dateHelper';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: any;
  onChange?: (e: any) => void;
  className?: string;
  textClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
}

export default function DateInput({
  value,
  onChange,
  className = '',
  textClassName = 'text-xs font-semibold',
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  min,
  max,
  ...props
}: DateInputProps) {
  const displayVal = value ? formatDateDDMMYYYY(value) : '';

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className={`${textClassName} select-none pointer-events-none truncate ${displayVal ? 'text-slate-700' : 'text-slate-400'}`}>
        {displayVal || placeholder}
      </span>
      <input
        type="date"
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        min={min}
        max={max}
        className="custom-date-overlay absolute inset-0 w-full h-full cursor-pointer z-10"
        {...props}
      />
    </div>
  );
}
