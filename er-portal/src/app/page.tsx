"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BedCard from "@/components/BedCard";

interface BedData {
  id: string;
  name: string;
  zone: string;
  room: string | null;
  color: string;
  patients: {
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
    chiefComplaints: string | null;
    arrivalDateTime: string | null;
    dispositionType: string | null;
    attendingDoctor: { name: string } | null;
  }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [beds, setBeds] = useState<BedData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeds = useCallback(async () => {
    const res = await fetch("/api/beds");
    if (res.ok) {
      const data = await res.json();
      setBeds(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBeds();
    const interval = setInterval(fetchBeds, 30000);
    return () => clearInterval(interval);
  }, [fetchBeds]);

  const occupied = beds.filter((b) => b.patients.length > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p style={{ color: "#64748B" }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1A202C" }}>ER Bed Board</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{occupied}/{beds.length} beds occupied</p>
          </div>
          <button onClick={() => router.push("/patients/new")}
            className="text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1B4965" }}>
            + New Patient
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {beds.map((bed) => (
            <BedCard key={bed.id} bed={bed} />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-6 text-xs" style={{ color: "#64748B" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#DC2626" }} /> Resus / Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#2EC4B6" }} /> Receiving / Trauma
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block border-2" style={{ borderColor: "#2EC4B6" }} /> General
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#3B82F6" }} /> Triage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block border-2 border-dashed border-gray-300" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#F39C12" }} /> Pending DC
          </span>
        </div>
      </div>
    </div>
  );
}
