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

const zoneConfig: Record<string, { occupied: string; empty: string; style?: React.CSSProperties; emptyStyle?: React.CSSProperties }> = {
  RESUS: {
    occupied: "bg-red-600 text-white",
    empty: "border-2 border-dashed border-red-400 bg-red-50",
  },
  RECEIVING: {
    occupied: "text-white",
    empty: "border-2 border-dashed bg-teal-50",
    style: { backgroundColor: "#2EC4B6" },
    emptyStyle: { borderColor: "#2EC4B6" },
  },
  TRAUMA: {
    occupied: "text-white",
    empty: "border-2 border-dashed bg-teal-50",
    style: { backgroundColor: "#36B5A8" },
    emptyStyle: { borderColor: "#36B5A8" },
  },
  GENERAL: {
    occupied: "bg-white border-l-4",
    empty: "border-2 border-dashed border-gray-300 bg-gray-50",
    style: { borderLeftColor: "#2EC4B6" },
  },
  TRIAGE: {
    occupied: "bg-white border-l-4",
    empty: "border-2 border-dashed border-blue-300 bg-blue-50",
    style: { borderLeftColor: "#3B82F6" },
  },
};

export default function BedCard({ bed }: { bed: BedData }) {
  const router = useRouter();
  const patient = bed.patients[0] || null;
  const isEmpty = !patient;
  const isPendingDC = patient?.dispositionType && !["ADMITTED"].includes(patient.dispositionType);

  const config = zoneConfig[bed.zone] || zoneConfig.GENERAL;

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

  const isWhiteCard = bed.zone === "GENERAL" || bed.zone === "TRIAGE";
  const textPrimary = isWhiteCard && !isEmpty ? { color: "#1A202C" } : {};
  const textSecondary = isWhiteCard && !isEmpty ? { color: "#64748B" } : {};

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-md min-h-[120px] ${
        isEmpty ? config.empty : config.occupied
      }`}
      style={isEmpty ? config.emptyStyle : config.style}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm" style={textPrimary}>{bed.name}</span>
        {isPendingDC && (
          <span className="text-white text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F39C12" }}>
            PENDING DC
          </span>
        )}
      </div>
      {patient ? (
        <div className={`rounded-lg p-2.5 text-sm ${
          isWhiteCard ? "bg-gray-50" : "bg-black/10"
        }`}>
          <div className="font-semibold" style={textPrimary}>
            {patient.name}{patient.age ? `, ${patient.age}` : ""}{patient.gender ? patient.gender[0] : ""}
          </div>
          {patient.chiefComplaints && (
            <div className="text-xs opacity-70 mt-0.5 line-clamp-1" style={textSecondary}>{patient.chiefComplaints}</div>
          )}
          <div className="text-xs opacity-50 mt-0.5" style={textSecondary}>
            Arrived {formatTime(patient.arrivalDateTime)}
            {patient.attendingDoctor && ` · ${patient.attendingDoctor.name}`}
          </div>
        </div>
      ) : (
        <div className="text-center italic text-sm py-4" style={{ color: "#94A3B8" }}>Available</div>
      )}
    </div>
  );
}
