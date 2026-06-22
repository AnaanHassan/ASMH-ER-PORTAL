"use client";

import React from "react";
import { TextField, TextAreaField, SelectField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  beds: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
}

export default function DemographicsTab({ patient, onChange, beds, doctors }: Props) {
  const arrivalVal = patient.arrivalDateTime
    ? new Date(patient.arrivalDateTime as string).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-6">
      {/* Patient Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4 flex items-center gap-2">
          <span>Patient Information</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <TextField label="Full Name" field="name" value={patient.name as string} onChange={onChange} />
          </div>
          <TextField label="Age" field="age" value={patient.age as number} onChange={onChange} type="number" />
          <SelectField
            label="Gender"
            field="gender"
            value={patient.gender as string}
            onChange={onChange}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
          <TextField label="NID / Passport" field="nidPassport" value={patient.nidPassport as string} onChange={onChange} />
          <TextField label="Hospital Number" field="hospitalNumber" value={patient.hospitalNumber as string} onChange={onChange} />
        </div>
      </div>

      {/* ER Assignment */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4 flex items-center gap-2">
          <span>ER Assignment</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Bed"
            field="bedId"
            value={patient.bedId as string}
            onChange={onChange}
            options={beds.map((b) => ({ value: b.id, label: b.name }))}
            placeholder="No bed assigned"
          />
          <TextField label="Arrival Date/Time" field="arrivalDateTime" value={arrivalVal} onChange={onChange} type="datetime-local" />
          <TextField label="Referred By" field="referredBy" value={patient.referredBy as string} onChange={onChange} />
          <SelectField
            label="Attending Doctor"
            field="attendingDoctorId"
            value={patient.attendingDoctorId as string}
            onChange={onChange}
            options={doctors.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
      </div>

      {/* Medical History */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4 flex items-center gap-2">
          <span>Medical History</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <TextAreaField label="Underlying Conditions" field="underlyingConditions" value={patient.underlyingConditions as string} onChange={onChange} />
          </div>
          <div className="col-span-2">
            <TextAreaField label="Regular Medications" field="regularMedications" value={patient.regularMedications as string} onChange={onChange} />
          </div>
          <TextField label="Allergy History" field="allergyHistory" value={patient.allergyHistory as string} onChange={onChange} />
          <TextField label="Last Meal" field="lastMeal" value={patient.lastMeal as string} onChange={onChange} />
          <TextField label="LMP" field="lmp" value={patient.lmp as string} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
