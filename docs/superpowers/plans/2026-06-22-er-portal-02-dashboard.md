# ER Portal — Part 2: Dashboard (Bed Board)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ER dashboard showing all 9 bed positions in a visual grid with patient info, color-coded by zone, with 30-second polling.

**Architecture:** Client component that fetches bed data via API, renders a 3x3 grid of bed cards. Clicking a bed navigates to patient record or new patient form.

**Tech Stack:** React (client component), Tailwind CSS, Next.js App Router

**Depends on:** Part 1 (setup, auth, beds API)

---

### Task 1: Top Navigation Bar

**Files:**
- Create: `er-portal/src/components/Navbar.tsx`
- Modify: `er-portal/src/app/layout.tsx`

- [ ] **Step 1: Create Navbar component**

Create `er-portal/src/components/Navbar.tsx`:

```tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ bedCount }: { bedCount?: { occupied: number; total: number } }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg">AMSH ER</Link>
        <span className="text-slate-500">|</span>
        <Link
          href="/"
          className={`text-sm hover:text-white ${pathname === "/" ? "text-white" : "text-slate-400"}`}
        >
          Dashboard
        </Link>
        <Link
          href="/patients"
          className={`text-sm hover:text-white ${pathname === "/patients" ? "text-white" : "text-slate-400"}`}
        >
          Patient Log
        </Link>
        {(session?.user as any)?.role === "ADMIN" && (
          <Link
            href="/admin/doctors"
            className={`text-sm hover:text-white ${pathname === "/admin/doctors" ? "text-white" : "text-slate-400"}`}
          >
            Manage Doctors
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {bedCount && (
          <span className="bg-emerald-600 text-xs px-2 py-1 rounded-full">
            {bedCount.occupied}/{bedCount.total} beds occupied
          </span>
        )}
        <span className="text-sm text-slate-300">{session?.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-slate-400 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add Navbar to layout**

Update `er-portal/src/app/layout.tsx` — add `<Navbar />` inside the AuthProvider, before `{children}`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMSH ER Portal",
  description: "Emergency Room Management - Dr. Abdul Samad Memorial Hospital",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add navigation bar with auth status"
```

---

### Task 2: Bed Card Component

**Files:**
- Create: `er-portal/src/components/BedCard.tsx`

- [ ] **Step 1: Create BedCard component**

Create `er-portal/src/components/BedCard.tsx`:

```tsx
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

export default function BedCard({ bed }: { bed: BedData }) {
  const router = useRouter();
  const patient = bed.patients[0] || null;
  const isEmpty = !patient;
  const isPendingDC = patient?.dispositionType && !["ADMITTED"].includes(patient.dispositionType);

  const zoneStyles: Record<string, string> = {
    RESUS: "bg-red-600 text-white",
    RECEIVING: "bg-red-300",
    TRAUMA: "bg-red-200",
    GENERAL: "bg-amber-50 border border-amber-200",
    TRIAGE: "bg-blue-50 border border-blue-200",
  };

  const emptyStyles: Record<string, string> = {
    RESUS: "bg-red-600/20 border-2 border-dashed border-red-400",
    RECEIVING: "bg-red-200/30 border-2 border-dashed border-red-300",
    TRAUMA: "bg-red-100/30 border-2 border-dashed border-red-200",
    GENERAL: "bg-amber-50/50 border-2 border-dashed border-amber-200",
    TRIAGE: "bg-blue-50/50 border-2 border-dashed border-blue-200",
  };

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

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg p-3 cursor-pointer transition-shadow hover:shadow-lg min-h-[120px] ${
        isEmpty ? emptyStyles[bed.zone] : zoneStyles[bed.zone]
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-sm">{bed.zone === "TRIAGE" ? `🪑 ${bed.name}` : bed.name}</span>
        {isPendingDC && (
          <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
            PENDING DC
          </span>
        )}
      </div>

      {patient ? (
        <div className={`rounded p-2 text-sm ${
          bed.zone === "RESUS" ? "bg-black/15" : "bg-black/5"
        }`}>
          <div className="font-semibold">
            {patient.name}{patient.age ? `, ${patient.age}` : ""}
            {patient.gender ? patient.gender[0] : ""}
          </div>
          {patient.chiefComplaints && (
            <div className="text-xs opacity-80 mt-0.5 line-clamp-1">
              {patient.chiefComplaints}
            </div>
          )}
          <div className="text-xs opacity-60 mt-0.5">
            Arrived {formatTime(patient.arrivalDateTime)}
            {patient.attendingDoctor && ` · ${patient.attendingDoctor.name}`}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 italic text-sm py-4">
          Available
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add BedCard component"
```

---

### Task 3: Dashboard Page

**Files:**
- Modify: `er-portal/src/app/page.tsx`

- [ ] **Step 1: Build dashboard page**

Replace `er-portal/src/app/page.tsx`:

```tsx
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
          <p className="text-sm text-gray-500">
            {occupied}/{beds.length} occupied
          </p>
        </div>
        <button
          onClick={() => router.push("/patients/new")}
          className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800"
        >
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
```

- [ ] **Step 2: Test the dashboard**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm run dev
```

1. Open http://localhost:3000, log in with admin/admin123
2. Should see 9 bed cards in a 3x3 grid, all showing "Available"
3. Click an empty bed → should navigate to `/patients/new?bed=<id>`
4. Click "+ New Patient" → should navigate to `/patients/new`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add ER dashboard with bed board grid"
```
