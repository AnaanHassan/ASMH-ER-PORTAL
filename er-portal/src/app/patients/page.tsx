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
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1A202C]">Patient Log</h1>
            {!loading && (
              <p className="text-sm text-[#64748B] mt-1">{patients.length} patient{patients.length !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or NID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 w-64 text-sm bg-white"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
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
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-[#64748B]">Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Age/Gender</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Bed</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Chief Complaint</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Arrival</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Doctor</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/patients/${p.id}`)}
                    className="group border-t border-gray-100 hover:bg-[#F0F4F8] cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A202C]">{p.name}</td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {p.age ?? "—"} / {p.gender ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{p.bed?.name ?? "—"}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-[#64748B]">
                      {p.chiefComplaints ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {p.arrivalDateTime
                        ? new Date(p.arrivalDateTime).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{p.attendingDoctor?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Delete patient "${p.name}"? This cannot be undone.`)) return;
                          const res = await fetch(`/api/patients/${p.id}`, { method: "DELETE" });
                          if (res.ok) fetchPatients();
                        }}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="text-gray-300 text-4xl mb-3">📋</div>
                      <p className="text-[#64748B] font-medium">No patients found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
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
