"use client";

import React from "react";
import { TextField, TextAreaField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export default function PhysicalExamTab({ patient, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <TextField label="General Condition (GC)" field="physicalExamGC" value={patient.physicalExamGC as string} onChange={onChange} />
      <TextAreaField label="O/E Findings" field="physicalExamFindings" value={patient.physicalExamFindings as string} onChange={onChange} rows={8} />
    </div>
  );
}
