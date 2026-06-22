"use client";

import React from "react";
import { TextField, TextAreaField, SelectField } from "./FormField";

interface Props {
  patient: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
  doctors: { id: string; name: string }[];
}

const checklistItems = [
  { field: "clMedications", label: "Medications" },
  { field: "clPrescription", label: "Prescription" },
  { field: "clLabReports", label: "Lab Reports" },
  { field: "clXrayEcg", label: "X-rays and CT scan CD / ECG" },
  { field: "clCtMriUsg", label: "CT / MRI / USG Report" },
  { field: "clMedCerts", label: "Medical Certificates" },
  { field: "clOldDocs", label: "Patient's Old Documents" },
];

export default function DispositionTab({ patient, onChange, doctors }: Props) {
  const dcDateVal = patient.dischargeDatetime
    ? new Date(patient.dischargeDatetime as string).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-6">
      {/* Disposition */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Disposition</h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Disposition Type"
            field="dispositionType"
            value={patient.dispositionType as string}
            onChange={onChange}
            options={[
              { value: "DISCHARGED_ER", label: "Discharged by ER" },
              { value: "ADMITTED", label: "Admitted" },
              { value: "REFERRED", label: "Referred" },
              { value: "DISCHARGED_REFERRED", label: "Discharged by Referred Dept" },
            ]}
          />
          <TextField label="Discharge Date/Time" field="dischargeDatetime" value={dcDateVal} onChange={onChange} type="datetime-local" />
        </div>
      </div>

      {/* Vitals at Discharge */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Vitals at Discharge</h3>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="GC" field="dcGC" value={patient.dcGC as string} onChange={onChange} />
          <TextField label="HR" field="dcHR" value={patient.dcHR as number} onChange={onChange} type="number" />
          <TextField label="RR" field="dcRR" value={patient.dcRR as number} onChange={onChange} type="number" />
          <TextField label="BP" field="dcBP" value={patient.dcBP as string} onChange={onChange} />
          <TextField label="SpO2" field="dcSpo2" value={patient.dcSpo2 as string} onChange={onChange} />
          <TextField label="Temp (°C)" field="dcTemp" value={patient.dcTemp as number} onChange={onChange} type="number" />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <TextField label="Chest" field="dcChest" value={patient.dcChest as string} onChange={onChange} />
          <TextField label="CVS" field="dcCVS" value={patient.dcCVS as string} onChange={onChange} />
          <TextField label="Abdomen" field="dcAbdomen" value={patient.dcAbdomen as string} onChange={onChange} />
          <TextField label="CNS" field="dcCNS" value={patient.dcCNS as string} onChange={onChange} />
        </div>
      </div>

      {/* Discharge Instructions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Discharge Instructions</h3>
        <div className="space-y-4">
          <TextAreaField label="Medications" field="dcMedications" value={patient.dcMedications as string} onChange={onChange} rows={3} />
          <TextAreaField label="Advice" field="dcAdvice" value={patient.dcAdvice as string} onChange={onChange} rows={3} />
          <TextField label="Follow-up" field="dcFollowUp" value={patient.dcFollowUp as string} onChange={onChange} />
        </div>
      </div>

      {/* Discharge Details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Discharge Details</h3>
        <div className="space-y-4">
          <SelectField
            label="Doctor"
            field="dcDoctorId"
            value={patient.dcDoctorId as string}
            onChange={onChange}
            options={doctors.map((d) => ({ value: d.id, label: d.name }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Condition Explained To (Name)" field="dcExplainedToName" value={patient.dcExplainedToName as string} onChange={onChange} />
            <TextField label="Relation" field="dcExplainedToRelation" value={patient.dcExplainedToRelation as string} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* Discharge Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Discharge Checklist</h3>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 border-b border-gray-200 font-medium text-gray-600">Item</th>
                <th className="px-4 py-2.5 border-b border-gray-200 w-16 font-medium text-gray-600">Yes</th>
                <th className="px-4 py-2.5 border-b border-gray-200 w-16 font-medium text-gray-600">No</th>
                <th className="px-4 py-2.5 border-b border-gray-200 w-16 font-medium text-gray-600">N/A</th>
              </tr>
            </thead>
            <tbody>
              {checklistItems.map((item, idx) => (
                <tr key={item.field} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                  <td className="px-4 py-2.5 text-gray-700">{item.label}</td>
                  {["Yes", "No", "NA"].map((val) => (
                    <td key={val} className="text-center px-4 py-2.5">
                      <input
                        type="radio"
                        name={item.field}
                        checked={(patient[item.field] as string) === val}
                        onChange={() => onChange(item.field, val)}
                        className="accent-[#2EC4B6]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handover */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#1B4965] mb-4">Handover</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Received By (Name)" field="dcReceivedByName" value={patient.dcReceivedByName as string} onChange={onChange} />
          <TextField label="Attending Nurse" field="dcAttendingNurse" value={patient.dcAttendingNurse as string} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
