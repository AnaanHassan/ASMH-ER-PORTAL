"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
}

export default function AdminDoctorsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "DOCTOR" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (!session || (session.user as any).role !== "ADMIN") {
      router.replace("/");
      return;
    }
    fetchDoctors();
  }, [session, authStatus, router]);

  async function fetchDoctors() {
    const res = await fetch("/api/doctors");
    if (res.ok) setDoctors(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create doctor");
      return;
    }
    setForm({ name: "", username: "", password: "", role: "DOCTOR" });
    setShowForm(false);
    fetchDoctors();
  }

  async function toggleActive(doctor: Doctor) {
    await fetch(`/api/doctors/${doctor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !doctor.active }),
    });
    fetchDoctors();
  }

  if (authStatus === "loading") return <p className="p-6 text-gray-500">Loading...</p>;
  if (!session || (session.user as any).role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add Doctor"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="border rounded-lg px-4 py-2 text-sm"
              />
              <input
                placeholder="Username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                className="border rounded-lg px-4 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="border rounded-lg px-4 py-2 text-sm"
              />
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="border rounded-lg px-4 py-2 text-sm"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Doctor"}
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.username}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {d.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {d.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(d)}
                      className={`text-xs px-3 py-1 rounded ${
                        d.active
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {d.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
