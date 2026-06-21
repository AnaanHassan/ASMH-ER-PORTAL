"use client";

import { useRouter } from "next/navigation";

interface BedPatient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  chiefComplaints: string | null;
  arrivalDateTime: string | null;
  dispositionType: string | null;
  attendingDoctor: { name: string } | null;
}

interface BedData {
  id: string;
  name: string;
  zone: string;
  room: string | null;
  color: string;
  patients: BedPatient[];
}

export default function BedCard({ bed }: { bed: BedData }) {
  const router = useRouter();
  const patient = bed.patients[0] || null;
  const isEmpty = !patient;
  const isPendingDC = patient?.dispositionType && !["ADMITTED"].includes(patient.dispositionType);

  const zoneStyles: Record<string, string> = {
    RESUS: "bg-red-600 text-white",
    RECEIVING: "bg-red-300",
    TRAUMA: "bg-red-200",
    GENERAL: "bg-amber-50 border border-amber-200",
    TRIAGE: "bg-blue-50 border border-blue-200",
  };

  const emptyStyles: Record<string, string> = {
    RESUS: "bg-red-600/20 border-2 border-dashed border-red-400",
    RECEIVING: "bg-red-200/30 border-2 border-dashed border-red-300",
    TRAUMA: "bg-red-100/30 border-2 border-dashed border-red-200",
    GENERAL: "bg-amber-50/50 border-2 border-dashed border-amber-200",
    TRIAGE: "bg-blue-50/50 border-2 border-dashed border-blue-200",
  };

  function handleClick() {
    if (patient) {
      router.push(`/patients/${patient.id}`);
    } else {
      router.push(`/patients/new?bed=${bed.id}`);
    }
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg p-3 cursor-pointer transition-shadow hover:shadow-lg min-h-[120px] ${
        isEmpty ? emptyStyles[bed.zone] : zoneStyles[bed.zone]
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm">{bed.zone === "TRIAGE" ? `🪑 ${bed.name}` : bed.name}</span>
        {isPendingDC && (
          <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">PENDING DC</span>
        )}
      </div>
      {patient ? (
        <div className={`rounded p-2 text-sm ${bed.zone === "RESUS" ? "bg-black/15" : "bg-black/5"}`}>
          <div className="font-semibold">
            {patient.name}{patient.age ? `, ${patient.age}` : ""}{patient.gender ? patient.gender[0] : ""}
          </div>
          {patient.chiefComplaints && (
            <div className="text-xs opacity-80 mt-0.5 line-clamp-1">{patient.chiefComplaints}</div>
          )}
          <div className="text-xs opacity-60 mt-0.5">
            Arrived {formatTime(patient.arrivalDateTime)}
            {patient.attendingDoctor && ` · ${patient.attendingDoctor.name}`}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 italic text-sm py-4">Available</div>
      )}
    </div>
  );
}
