"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NewPatientForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bedId = searchParams.get("bed") || "";
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), bedId: bedId || null }),
    });

    if (res.ok) {
      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    } else {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold text-[#1B4965]">New Patient</h1>
        <p className="text-sm text-[#64748B] mt-1">Create a new ER patient record</p>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Patient Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter patient full name"
          autoFocus
          className="w-full border border-gray-200 rounded-lg bg-gray-50 px-3 py-2.5 text-sm focus:bg-white focus:ring-0 focus:outline-none placeholder:text-gray-400"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#1B4965" }}
      >
        {submitting ? "Creating..." : "Create & Open Record"}
      </button>
    </form>
  );
}

export default function NewPatientPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Suspense fallback={<p className="text-[#64748B]">Loading...</p>}>
        <NewPatientForm />
      </Suspense>
    </div>
  );
}
