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
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bed Board</h1>
          <p className="text-sm text-gray-500">{occupied}/{beds.length} occupied</p>
        </div>
        <button onClick={() => router.push("/patients/new")}
          className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800">
          + New Patient
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {beds.map((bed) => (
          <BedCard key={bed.id} bed={bed} />
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        <span>🔴 Resus/Critical</span>
        <span>🩷 Receiving/Trauma</span>
        <span>🟡 General Beds</span>
        <span>🔵 Triage</span>
        <span>⬜ Available</span>
        <span className="text-orange-500">⏳ Pending Discharge</span>
      </div>
    </div>
  );
}
