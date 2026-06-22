"use client";

import React from "react";
import { TextAreaField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export default function TreatmentTab({ patient, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <TextAreaField label="Working Diagnosis" field="workingDiagnosis" value={patient.workingDiagnosis as string} onChange={onChange} rows={3} />
      <TextAreaField label="Initial Treatment" field="initialTreatment" value={patient.initialTreatment as string} onChange={onChange} rows={4} />
      <TextAreaField label="Course of Management" field="courseOfManagement" value={patient.courseOfManagement as string} onChange={onChange} rows={6} />
      <TextAreaField label="Referrals / Outcomes" field="referralsOutcomes" value={patient.referralsOutcomes as string} onChange={onChange} rows={4} />
    </div>
  );
}
