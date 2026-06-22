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
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

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
    setSuccess("");
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
    setSuccess("Doctor created successfully");
    setTimeout(() => setSuccess(""), 3000);
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

  async function handleDelete(doctor: Doctor) {
    if (!confirm(`Are you sure you want to permanently delete ${doctor.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/doctors/${doctor.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete");
      return;
    }
    setSuccess(`${doctor.name} deleted`);
    setTimeout(() => setSuccess(""), 3000);
    fetchDoctors();
  }

  async function handleResetPassword(doctorId: string) {
    if (!newPassword || newPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    const res = await fetch(`/api/doctors/${doctorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) {
      setResetPasswordId(null);
      setNewPassword("");
      setSuccess("Password reset successfully");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  if (authStatus === "loading") return <p className="p-6 text-gray-500">Loading...</p>;
  if (!session || (session.user as any).role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
            <p className="text-sm text-gray-500 mt-1">{doctors.length} doctor{doctors.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              showForm ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showForm ? "Cancel" : "+ Add Doctor"}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Doctor</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  placeholder="Dr. Ahmed Ali"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                <input
                  placeholder="ahmed"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Doctor"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Username</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.username}</td>
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
                    <div className="flex gap-2 justify-end">
                      {resetPasswordId === d.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="border rounded px-2 py-1 text-xs w-28"
                            autoFocus
                          />
                          <button
                            onClick={() => handleResetPassword(d.id)}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setResetPasswordId(null); setNewPassword(""); }}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setResetPasswordId(d.id); setNewPassword(""); }}
                            className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => toggleActive(d)}
                            className={`text-xs px-2 py-1 rounded ${
                              d.active
                                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {d.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDelete(d)}
                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No doctors found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
