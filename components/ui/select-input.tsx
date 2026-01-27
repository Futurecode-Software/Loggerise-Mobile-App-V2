/**
 * SelectInput Component
 *
 * Select component wrapper - uses the new Select component with green header modal
 */

import React from 'react';
import { Select } from './select';

interface Option {
  label: string;
  value: string | number;
}

interface SelectInputProps {
  label?: string;
  options: Option[];
  selectedValue?: string | number | null;
  /** Alias for selectedValue - for consistent API */
  value?: string | number | null;
  onValueChange: (value: string | number | null) => void;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export function SelectInput({
  label,
  options,
  selectedValue,
  value: valueProp,
  onValueChange,
  error,
  placeholder = 'Seçiniz...',
  searchable = true,
  disabled = false,
}: SelectInputProps) {
  // Support both selectedValue and value props
  const currentValue = selectedValue ?? valueProp ?? null;

  return (
    <Select
      label={label}
      data={options}
      value={currentValue}
      onValueChange={(val) => {
        onValueChange(val ?? null);
      }}
      error={error}
      placeholder={placeholder}
      searchable={searchable}
      disabled={disabled}
    />
  );
}
