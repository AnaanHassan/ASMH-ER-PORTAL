"use client";

import React from "react";
import { TextAreaField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export default function PresentingComplaintTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextAreaField label="Chief Complaints" field="chiefComplaints" value={patient.chiefComplaints as string} onChange={onChange} rows={4} />
      <TextAreaField label="History of Presenting Illness (HPI)" field="historyOfPresentingIllness" value={patient.historyOfPresentingIllness as string} onChange={onChange} rows={6} />
    </div>
  );
}
