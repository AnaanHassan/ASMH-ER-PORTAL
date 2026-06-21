# ER Portal — Part 5: Patient Log & Admin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the patient log (searchable table of all patients) and the admin page for managing doctor accounts.

**Architecture:** Server-fetched data with client-side filtering UI. Admin page restricted to ADMIN role users.

**Tech Stack:** React, Tailwind CSS, Next.js API routes, Prisma, bcryptjs

**Depends on:** Parts 1-4

---

### Task 1: Patient Log Page

**Files:**
- Create: `er-portal/src/app/patients/page.tsx`

- [ ] **Step 1: Create patient log page**

Create `er-portal/src/app/patients/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PatientLogPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  useEffect(() => {
    fetch("/api/doctors").then((r) => r.json()).then(setDoctors);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (doctorFilter) params.set("doctorId", doctorFilter);

    fetch(`/api/patients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      });
  }, [search, statusFilter, doctorFilter]);

  function formatDateTime(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: "Active",
    DISCHARGED: "Discharged",
    ADMITTED: "Admitted",
    REFERRED: "Referred",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Patient Log</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or NID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DISCHARGED">Discharged</option>
          <option value="ADMITTED">Admitted</option>
          <option value="REFERRED">Referred</option>
        </select>
        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All Doctors</option>
          {doctors.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Age/Gender</th>
              <th className="text-left p-3">Bed</th>
              <th className="text-left p-3">Chief Complaint</th>
              <th className="text-left p-3">Arrival</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Doctor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No patients found</td></tr>
            ) : (
              patients.map((p: any) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/patients/${p.id}`)}
                  className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer"
                >
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.age ?? "—"}{p.gender ? p.gender[0] : ""}</td>
                  <td className="p-3">{p.bed?.name || "—"}</td>
                  <td className="p-3 max-w-[200px] truncate">{p.chiefComplaints || "—"}</td>
                  <td className="p-3">{formatDateTime(p.arrivalDateTime)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      p.status === "DISCHARGED" ? "bg-gray-100 text-gray-600" :
                      p.status === "ADMITTED" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                  </td>
                  <td className="p-3">{p.attendingDoctor?.name || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add patient log page with search and filters"
```

---

### Task 2: Admin — Doctor Management API

**Files:**
- Create: `er-portal/src/app/api/doctors/[id]/route.ts`
- Modify: `er-portal/src/app/api/doctors/route.ts` (add POST)

- [ ] **Step 1: Add POST to doctors route for creating doctors**

Add to the existing `er-portal/src/app/api/doctors/route.ts`, after the GET export:

```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || !body.username || !body.password) {
    return NextResponse.json({ error: "Name, username, and password required" }, { status: 400 });
  }

  const existing = await prisma.doctor.findUnique({ where: { username: body.username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(body.password, 10);

  const doctor = await prisma.doctor.create({
    data: {
      name: body.name,
      username: body.username,
      passwordHash,
      role: body.role || "DOCTOR",
    },
  });

  return NextResponse.json({ id: doctor.id, name: doctor.name, username: doctor.username, role: doctor.role }, { status: 201 });
}
```

Add `NextRequest` to the imports at the top of the file.

- [ ] **Step 2: Create single doctor PATCH route**

Create `er-portal/src/app/api/doctors/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};

  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.password) {
    const bcrypt = await import("bcryptjs");
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const doctor = await prisma.doctor.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, username: true, role: true, active: true },
  });

  return NextResponse.json(doctor);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add doctor management API routes"
```

---

### Task 3: Admin — Doctor Management Page

**Files:**
- Create: `er-portal/src/app/admin/doctors/page.tsx`

- [ ] **Step 1: Create admin doctors page**

Create `er-portal/src/app/admin/doctors/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ManageDoctorsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", password: "", role: "DOCTOR" });
  const [error, setError] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, router]);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    const res = await fetch("/api/doctors");
    if (res.ok) setDoctors(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setShowForm(false);
      setFormData({ name: "", username: "", password: "", role: "DOCTOR" });
      loadDoctors();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/doctors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    loadDoctors();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Manage Doctors</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800"
        >
          {showForm ? "Cancel" : "+ Add Doctor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">
            Create Doctor
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d: any) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3 text-gray-500">{d.username}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {d.role}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs ${d.active !== false ? "text-green-600" : "text-red-600"}`}>
                    {d.active !== false ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive(d.id, d.active !== false)}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    {d.active !== false ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update doctors GET to include all fields for admin**

Modify the GET in `er-portal/src/app/api/doctors/route.ts` — change the select to also include `username` and `active`:

```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = (session.user as any).role === "ADMIN";

  const doctors = await prisma.doctor.findMany({
    where: isAdmin ? {} : { active: true },
    select: {
      id: true,
      name: true,
      role: true,
      ...(isAdmin ? { username: true, active: true } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}
```

- [ ] **Step 3: Test the full admin flow**

1. Log in as admin, go to /admin/doctors
2. Create a new doctor account
3. Log out, log in as the new doctor
4. Verify the new doctor can see the dashboard and create patients
5. Log back in as admin, deactivate the doctor
6. Verify the deactivated doctor can no longer log in

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin doctor management page"
```

---

### Task 4: Update Patient Status on Disposition

**Files:**
- Modify: `er-portal/src/app/api/patients/[id]/route.ts`

- [ ] **Step 1: Auto-update patient status when disposition is set**

In the PATCH handler of `er-portal/src/app/api/patients/[id]/route.ts`, add status update logic before the prisma update call:

```typescript
  // Auto-update status based on disposition
  if (data.dispositionType) {
    const statusMap: Record<string, string> = {
      DISCHARGED_ER: "DISCHARGED",
      ADMITTED: "ADMITTED",
      REFERRED: "REFERRED",
      DISCHARGED_REFERRED: "DISCHARGED",
    };
    data.status = statusMap[data.dispositionType] || data.status;
  }
```

- [ ] **Step 2: Test**

1. Create a patient, assign to a bed
2. Set disposition to "Discharged by ER" on the Disposition tab
3. Go back to dashboard — bed should now show "PENDING DC" badge
4. Go to Patient Log — patient status should show "Discharged"

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: auto-update patient status on disposition change"
```

---

### Task 5: Final Integration Test

- [ ] **Step 1: Full end-to-end test**

Run through the complete workflow:

1. Log in as admin
2. Create a doctor account (e.g., "Dr. Anaan")
3. Log out, log in as Dr. Anaan
4. Dashboard shows 9 empty beds
5. Click Bed 3 (R3) → create patient "Zulfa Abdulla"
6. Fill in all 7 tabs with realistic data
7. Switch to dashboard mid-entry → back to patient → verify data persisted
8. Export Observation Chart → open .docx → verify letterhead and all data
9. Fill Disposition tab (Discharged by ER, discharge vitals, checklist)
10. Export Discharge Summary → verify arrival vs discharge vitals side by side
11. Dashboard shows Bed 3 as "PENDING DC"
12. Patient Log shows Zulfa as "Discharged"
13. Create second patient on RESUS → verify both patients visible
14. Search Patient Log by name and NID

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes"
```
