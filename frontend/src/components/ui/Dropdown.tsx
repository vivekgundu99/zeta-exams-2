// frontend/src/components/ui/Dropdown.tsx - UPDATED
'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface DropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 border rounded-lg transition-all duration-200',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
            'appearance-none',
            error 
              ? 'border-red-500' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;