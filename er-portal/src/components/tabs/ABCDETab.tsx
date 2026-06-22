"use client";

import React from "react";
import { TextField, SelectField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

function SectionHeader({ letter, color, title }: { letter: string; color: string; title: string }) {
  return <h3 className={`text-sm font-bold ${color} mt-4 mb-2`}>{letter} — {title}</h3>;
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
    <div className="space-y-2">
      <SectionHeader letter="A" color="text-red-700" title="Airway" />
      <TextField label="Speech / Added Sounds" field="airwaySpeech" value={patient.airwaySpeech as string} onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="SpO2 %" field="spo2Percent" value={patient.spo2Percent as number} onChange={onChange} type="number" />
        <TextField label="SpO2 per Liter" field="spo2PerLiter" value={patient.spo2PerLiter as string} onChange={onChange} />
      </div>

      <SectionHeader letter="B" color="text-orange-700" title="Breathing" />
      <TextField label="RR" field="rr" value={patient.rr as number} onChange={onChange} type="number" />
      <TextField label="Chest Findings" field="chestFindings" value={patient.chestFindings as string} onChange={onChange} />

      <SectionHeader letter="C" color="text-yellow-700" title="Circulation" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="PR" field="pr" value={patient.pr as number} onChange={onChange} type="number" />
        <TextField label="BP" field="bp" value={patient.bp as string} onChange={onChange} placeholder="e.g. 120/80" />
      </div>
      <TextField label="Heart Sounds" field="heartSounds" value={patient.heartSounds as string} onChange={onChange} />
      <TextField label="GRBS" field="grbs" value={patient.grbs as number} onChange={onChange} type="number" />

      <SectionHeader letter="D" color="text-blue-700" title="Disability" />
      <div className="grid grid-cols-3 gap-3">
        <SelectField label="GCS E (1-4)" field="gcsE" value={String(patient.gcsE ?? "")} onChange={onChange}
          options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))} />
        <SelectField label="GCS V (1-5)" field="gcsV" value={String(patient.gcsV ?? "")} onChange={onChange}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))} />
        <SelectField label="GCS M (1-6)" field="gcsM" value={String(patient.gcsM ?? "")} onChange={onChange}
          options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))} />
      </div>
      {gcsTotal > 0 && (
        <p className="text-sm font-semibold text-blue-700">GCS Total: {gcsTotal}/15</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Pupil Diameter R" field="pupilDiameterR" value={patient.pupilDiameterR as string} onChange={onChange} />
        <TextField label="Pupil Diameter L" field="pupilDiameterL" value={patient.pupilDiameterL as string} onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Reaction to Light R" field="pupilReactionR" value={patient.pupilReactionR as string} onChange={onChange} options={reactionOptions} />
        <SelectField label="Reaction to Light L" field="pupilReactionL" value={patient.pupilReactionL as string} onChange={onChange} options={reactionOptions} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Corneal Reflex R" field="cornealReflexR" value={patient.cornealReflexR as string} onChange={onChange}
          options={[{ value: "Present", label: "Present" }, { value: "Absent", label: "Absent" }]} />
        <SelectField label="Corneal Reflex L" field="cornealReflexL" value={patient.cornealReflexL as string} onChange={onChange}
          options={[{ value: "Present", label: "Present" }, { value: "Absent", label: "Absent" }]} />
      </div>

      <SectionHeader letter="E" color="text-green-700" title="Exposure" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="UL Right" field="ulRight" value={patient.ulRight as string} onChange={onChange} />
        <TextField label="UL Left" field="ulLeft" value={patient.ulLeft as string} onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="LL Right" field="llRight" value={patient.llRight as string} onChange={onChange} />
        <TextField label="LL Left" field="llLeft" value={patient.llLeft as string} onChange={onChange} />
      </div>
      <TextField label="Temperature (°C)" field="tempC" value={patient.tempC as number} onChange={onChange} type="number" />
      <TextField label="Abdomen / Log Roll" field="abdomenLogRoll" value={patient.abdomenLogRoll as string} onChange={onChange} />
      <TextField label="DRE" field="dre" value={patient.dre as string} onChange={onChange} />
      <TextField label="Bedside USG" field="bedsideUsg" value={patient.bedsideUsg as string} onChange={onChange} />
    </div>
  );
}
