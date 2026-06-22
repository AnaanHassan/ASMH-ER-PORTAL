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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
      <h1 className="text-xl font-bold text-gray-800">New Patient</h1>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Patient Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter patient name"
          autoFocus
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="w-full bg-blue-700 text-white py-2 rounded text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create & Open Record"}
      </button>
    </form>
  );
}

export default function NewPatientPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <NewPatientForm />
      </Suspense>
    </div>
  );
}
