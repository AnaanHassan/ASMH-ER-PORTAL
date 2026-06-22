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
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 focus:bg-white focus:ring-0 focus:outline-none placeholder:text-gray-400"
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
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 resize-y focus:bg-white focus:ring-0 focus:outline-none placeholder:text-gray-400"
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
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 focus:bg-white focus:ring-0 focus:outline-none"
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
    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(field, e.target.checked)}
        className="w-4 h-4 rounded accent-[#2EC4B6]"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
