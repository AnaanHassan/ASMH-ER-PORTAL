"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAutoSave } from "@/hooks/useAutoSave";
import DemographicsTab from "@/components/tabs/DemographicsTab";
import PresentingComplaintTab from "@/components/tabs/PresentingComplaintTab";
import ABCDETab from "@/components/tabs/ABCDETab";
import PhysicalExamTab from "@/components/tabs/PhysicalExamTab";
import InvestigationsTab from "@/components/tabs/InvestigationsTab";
import TreatmentTab from "@/components/tabs/TreatmentTab";
import DispositionTab from "@/components/tabs/DispositionTab";

const TABS = [
  "Demographics",
  "Presenting Complaint",
  "ABCDE",
  "Physical Exam",
  "Investigations",
  "Treatment",
  "Disposition",
];

export default function PatientRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null);
  const [beds, setBeds] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { updateField, flushNow, saveStatus } = useAutoSave(id);

  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${id}`).then((r) => r.json()),
      fetch("/api/beds").then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
    ]).then(([p, b, d]) => {
      setPatient(p);
      setBeds(b);
      setDoctors(d);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (field: string, value: unknown) => {
    setPatient((prev) => (prev ? { ...prev, [field]: value } : prev));
    updateField(field, value);
  };

  const handleBack = () => {
    flushNow();
    router.push("/");
  };

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-gray-500">Loading patient record...</p>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    idle: "",
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
  };
  const statusColor: Record<string, string> = {
    idle: "",
    saving: "text-yellow-300",
    saved: "text-green-300",
    error: "text-red-300",
  };

  return (
    <div>
      {/* Banner */}
      <div className="bg-slate-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="text-sm hover:underline">
            &larr; Dashboard
          </button>
          <div>
            <span className="font-bold text-lg">{patient.name as string}</span>
            <span className="ml-3 text-sm text-gray-300">
              {patient.age ? `${patient.age}y` : ""}{patient.gender ? ` ${patient.gender}` : ""}
              {patient.nidPassport ? ` | NID: ${patient.nidPassport}` : ""}
              {(patient.bed as Record<string, unknown>)?.name ? ` | Bed: ${(patient.bed as Record<string, unknown>).name}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus !== "idle" && (
            <span className={`text-xs ${statusColor[saveStatus]}`}>{statusLabel[saveStatus]}</span>
          )}
          <a
            href={`/api/patients/${id}/export/observation`}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded"
          >
            Export Observation Chart
          </a>
          <a
            href={`/api/patients/${id}/export/discharge`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded"
          >
            Export Discharge Summary
          </a>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white px-6 flex gap-0 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === i
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-3xl mx-auto p-6">
        {activeTab === 0 && <DemographicsTab patient={patient} onChange={handleChange} beds={beds} doctors={doctors} />}
        {activeTab === 1 && <PresentingComplaintTab patient={patient} onChange={handleChange} />}
        {activeTab === 2 && <ABCDETab patient={patient} onChange={handleChange} />}
        {activeTab === 3 && <PhysicalExamTab patient={patient} onChange={handleChange} />}
        {activeTab === 4 && <InvestigationsTab patient={patient} onChange={handleChange} />}
        {activeTab === 5 && <TreatmentTab patient={patient} onChange={handleChange} />}
        {activeTab === 6 && <DispositionTab patient={patient} onChange={handleChange} doctors={doctors} />}
      </div>
    </div>
  );
}
