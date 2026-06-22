"use client";

import React from "react";
import { CheckboxField, TextField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export default function InvestigationsTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Blood</h3>
        <div className="grid grid-cols-3 gap-1">
          <CheckboxField label="CBC" field="invCBC" checked={!!patient.invCBC} onChange={onChange} />
          <CheckboxField label="LFT" field="invLFT" checked={!!patient.invLFT} onChange={onChange} />
          <CheckboxField label="RFT" field="invRFT" checked={!!patient.invRFT} onChange={onChange} />
          <CheckboxField label="Electrolytes" field="invElectrolytes" checked={!!patient.invElectrolytes} onChange={onChange} />
          <CheckboxField label="Cardiac Markers" field="invCardiacMarkers" checked={!!patient.invCardiacMarkers} onChange={onChange} />
          <CheckboxField label="CRP" field="invCRP" checked={!!patient.invCRP} onChange={onChange} />
          <CheckboxField label="Dengue" field="invDengue" checked={!!patient.invDengue} onChange={onChange} />
          <CheckboxField label="RBS" field="invRBS" checked={!!patient.invRBS} onChange={onChange} />
          <CheckboxField label="S.BHCG / UPT" field="invBHCG" checked={!!patient.invBHCG} onChange={onChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Urine</h3>
        <div className="grid grid-cols-3 gap-1">
          <CheckboxField label="Routine" field="invUrineRoutine" checked={!!patient.invUrineRoutine} onChange={onChange} />
          <CheckboxField label="Culture" field="invUrineCulture" checked={!!patient.invUrineCulture} onChange={onChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Radiology</h3>
        <div className="grid grid-cols-3 gap-1">
          <CheckboxField label="ECG" field="invECG" checked={!!patient.invECG} onChange={onChange} />
          <CheckboxField label="X-ray" field="invXray" checked={!!patient.invXray} onChange={onChange} />
          <CheckboxField label="USG" field="invUSG" checked={!!patient.invUSG} onChange={onChange} />
          <CheckboxField label="Doppler" field="invDoppler" checked={!!patient.invDoppler} onChange={onChange} />
          <CheckboxField label="CT" field="invCT" checked={!!patient.invCT} onChange={onChange} />
          <CheckboxField label="MRI" field="invMRI" checked={!!patient.invMRI} onChange={onChange} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <TextField label="Others" field="invOthers" value={patient.invOthers as string} onChange={onChange} />
      </div>
    </div>
  );
}
