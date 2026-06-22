"use client";

import React from "react";

interface TextFieldProps {
  label: string;
  field: string;
  value: string | number | null | undefined;
  onChange: (field: string, value: string) => void;
  type?: "text" | "number" | "datetime-local";
  placeholder?: string;
  readOnly?: boolean;
}

export function TextField({ label, field, value, onChange, type = "text", placeholder, readOnly }: TextFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  field: string;
  value: string | null | undefined;
  onChange: (field: string, value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextAreaField({ label, field, value, onChange, rows = 3, placeholder }: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  field: string;
  value: string | null | undefined;
  onChange: (field: string, value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, field, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  field: string;
  checked: boolean;
  onChange: (field: string, value: boolean) => void;
}

export function CheckboxField({ label, field, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(field, e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
