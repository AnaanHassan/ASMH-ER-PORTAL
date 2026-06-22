"use client";

import React from "react";
import { TextField, SelectField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

export default function ABCDETab({ patient, onChange }: Props) {
  const gcsE = Number(patient.gcsE) || 0;
  const gcsV = Number(patient.gcsV) || 0;
  const gcsM = Number(patient.gcsM) || 0;
  const gcsTotal = gcsE + gcsV + gcsM;

  const reactionOptions = [
    { value: "Brisk", label: "Brisk" },
    { value: "Sluggish", label: "Sluggish" },
    { value: "Fixed", label: "Fixed" },
  ];

  return (
    <div className="space-y-6">
      {/* A — Airway */}
      <div className="bg-white rounded-xl border-l-4 border-[#DC2626] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#DC2626] mb-4">A — Airway</h3>
        <div className="space-y-4">
          <TextField label="Speech / Added Sounds" field="airwaySpeech" value={patient.airwaySpeech as string} onChange={onChange} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="SpO2 %" field="spo2Percent" value={patient.spo2Percent as number} onChange={onChange} type="number" />
            <TextField label="SpO2 per Liter" field="spo2PerLiter" value={patient.spo2PerLiter as string} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* B — Breathing */}
      <div className="bg-white rounded-xl border-l-4 border-[#F97316] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#F97316] mb-4">B — Breathing</h3>
        <div className="space-y-4">
          <TextField label="RR" field="rr" value={patient.rr as number} onChange={onChange} type="number" />
          <TextField label="Chest Findings" field="chestFindings" value={patient.chestFindings as string} onChange={onChange} />
        </div>
      </div>

      {/* C — Circulation */}
      <div className="bg-white rounded-xl border-l-4 border-[#EAB308] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#EAB308] mb-4">C — Circulation</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="PR" field="pr" value={patient.pr as number} onChange={onChange} type="number" />
            <TextField label="BP" field="bp" value={patient.bp as string} onChange={onChange} placeholder="e.g. 120/80" />
          </div>
          <TextField label="Heart Sounds" field="heartSounds" value={patient.heartSounds as string} onChange={onChange} />
          <TextField label="GRBS" field="grbs" value={patient.grbs as number} onChange={onChange} type="number" />
        </div>
      </div>

      {/* D — Disability */}
      <div className="bg-white rounded-xl border-l-4 border-[#3B82F6] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#3B82F6] mb-4">D — Disability</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SelectField label="GCS E (1-4)" field="gcsE" value={String(patient.gcsE ?? "")} onChange={onChange}
              options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))} />
            <SelectField label="GCS V (1-5)" field="gcsV" value={String(patient.gcsV ?? "")} onChange={onChange}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))} />
            <SelectField label="GCS M (1-6)" field="gcsM" value={String(patient.gcsM ?? "")} onChange={onChange}
              options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))} />
          </div>
          {gcsTotal > 0 && (
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center">
              <span className="text-2xl font-bold text-[#3B82F6]">{gcsTotal}</span>
              <span className="text-sm text-blue-600 ml-1">/15 GCS</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Pupil Diameter R" field="pupilDiameterR" value={patient.pupilDiameterR as string} onChange={onChange} />
            <TextField label="Pupil Diameter L" field="pupilDiameterL" value={patient.pupilDiameterL as string} onChange={onChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Reaction to Light R" field="pupilReactionR" value={patient.pupilReactionR as string} onChange={onChange} options={reactionOptions} />
            <SelectField label="Reaction to Light L" field="pupilReactionL" value={patient.pupilReactionL as string} onChange={onChange} options={reactionOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Corneal Reflex R" field="cornealReflexR" value={patient.cornealReflexR as string} onChange={onChange}
              options={[{ value: "Present", label: "Present" }, { value: "Absent", label: "Absent" }]} />
            <SelectField label="Corneal Reflex L" field="cornealReflexL" value={patient.cornealReflexL as string} onChange={onChange}
              options={[{ value: "Present", label: "Present" }, { value: "Absent", label: "Absent" }]} />
          </div>
        </div>
      </div>

      {/* E — Exposure */}
      <div className="bg-white rounded-xl border-l-4 border-[#22C55E] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#22C55E] mb-4">E — Exposure</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="UL Right" field="ulRight" value={patient.ulRight as string} onChange={onChange} />
            <TextField label="UL Left" field="ulLeft" value={patient.ulLeft as string} onChange={onChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="LL Right" field="llRight" value={patient.llRight as string} onChange={onChange} />
            <TextField label="LL Left" field="llLeft" value={patient.llLeft as string} onChange={onChange} />
          </div>
          <TextField label="Temperature (°C)" field="tempC" value={patient.tempC as number} onChange={onChange} type="number" />
          <TextField label="Abdomen / Log Roll" field="abdomenLogRoll" value={patient.abdomenLogRoll as string} onChange={onChange} />
          <TextField label="DRE" field="dre" value={patient.dre as string} onChange={onChange} />
          <TextField label="Bedside USG" field="bedsideUsg" value={patient.bedsideUsg as string} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
