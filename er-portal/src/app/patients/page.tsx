"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  chiefComplaints: string | null;
  arrivalDateTime: string | null;
  status: string;
  bed: { name: string } | null;
  attendingDoctor: { name: string } | null;
}

interface Doctor {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DISCHARGED: "bg-gray-100 text-gray-800",
  ADMITTED: "bg-blue-100 text-blue-800",
  REFERRED: "bg-yellow-100 text-yellow-800",
};

export default function PatientLogPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (doctorId) params.set("doctorId", doctorId);
    const res = await fetch(`/api/patients?${params}`);
    if (res.ok) setPatients(await res.json());
    setLoading(false);
  }, [search, status, doctorId]);

  useEffect(() => {
    fetch("/api/doctors").then(r => r.json()).then(setDoctors).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timeout);
  }, [fetchPatients]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Log</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or NID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64 text-sm"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="ADMITTED">Admitted</option>
            <option value="REFERRED">Referred</option>
          </select>
          <select
            value={doctorId}
            onChange={e => setDoctorId(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Age/Gender</th>
                  <th className="px-4 py-3 font-medium">Bed</th>
                  <th className="px-4 py-3 font-medium">Chief Complaint</th>
                  <th className="px-4 py-3 font-medium">Arrival</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/patients/${p.id}`)}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.age ?? "—"} / {p.gender ?? "—"}
                    </td>
                    <td className="px-4 py-3">{p.bed?.name ?? "—"}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      {p.chiefComplaints ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.arrivalDateTime
                        ? new Date(p.arrivalDateTime).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.attendingDoctor?.name ?? "—"}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
