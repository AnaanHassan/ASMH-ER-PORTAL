# ER Portal — Part 3: Patient Record (Tabs + Auto-save)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tabbed patient record form with 7 tabs, auto-save on every field change, and the new patient creation flow.

**Architecture:** Client component with tab navigation. A custom `useAutoSave` hook debounces field changes and PATCHes the patient via API. Each tab is a separate component receiving the patient state and an onChange handler.

**Tech Stack:** React, Tailwind CSS, Next.js API routes, Prisma

**Depends on:** Parts 1-2

---

### Task 1: Patient CRUD API

**Files:**
- Create: `er-portal/src/app/api/patients/route.ts`
- Create: `er-portal/src/app/api/patients/[id]/route.ts`

- [ ] **Step 1: Create patients list + create API**

Create `er-portal/src/app/api/patients/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const doctorId = searchParams.get("doctorId") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nidPassport: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (doctorId) where.attendingDoctorId = doctorId;
  if (from || to) {
    where.arrivalDateTime = {};
    if (from) where.arrivalDateTime.gte = new Date(from);
    if (to) where.arrivalDateTime.lte = new Date(to);
  }

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { arrivalDateTime: "desc" },
    include: {
      bed: { select: { name: true } },
      attendingDoctor: { select: { name: true } },
    },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const patient = await prisma.patient.create({
    data: {
      name: body.name || "New Patient",
      age: body.age || null,
      gender: body.gender || null,
      bedId: body.bedId || null,
      arrivalDateTime: new Date(),
      attendingDoctorId: (session.user as any).id,
      allergyHistory: "NKDA",
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
```

- [ ] **Step 2: Create single patient GET + PATCH API**

Create `er-portal/src/app/api/patients/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      bed: true,
      attendingDoctor: { select: { id: true, name: true } },
      dcDoctor: { select: { id: true, name: true } },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Convert datetime strings to Date objects
  const data: any = { ...body };
  if (data.arrivalDateTime) data.arrivalDateTime = new Date(data.arrivalDateTime);
  if (data.dischargeDatetime) data.dischargeDatetime = new Date(data.dischargeDatetime);

  // Convert numeric strings
  const intFields = ["age", "rr", "pr", "gcsE", "gcsV", "gcsM", "dcHR", "dcRR"];
  const floatFields = ["spo2Percent", "grbs", "tempC", "dcTemp"];
  for (const f of intFields) {
    if (f in data) data[f] = data[f] === "" || data[f] === null ? null : parseInt(data[f]);
  }
  for (const f of floatFields) {
    if (f in data) data[f] = data[f] === "" || data[f] === null ? null : parseFloat(data[f]);
  }

  const patient = await prisma.patient.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(patient);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add patient CRUD API routes"
```

---

### Task 2: Auto-save Hook

**Files:**
- Create: `er-portal/src/hooks/useAutoSave.ts`

- [ ] **Step 1: Create the auto-save hook**

Create `er-portal/src/hooks/useAutoSave.ts`:

```typescript
import { useCallback, useRef, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(patientId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<Record<string, any>>({});

  const flush = useCallback(async () => {
    const data = { ...pendingRef.current };
    pendingRef.current = {};

    if (Object.keys(data).length === 0) return;

    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [patientId]);

  const updateField = useCallback(
    (field: string, value: any) => {
      pendingRef.current[field] = value;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 500);
    },
    [flush]
  );

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    flush();
  }, [flush]);

  return { updateField, flushNow, saveStatus };
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add useAutoSave hook with debounced PATCH"
```

---

### Task 3: Tab Components

**Files:**
- Create: `er-portal/src/components/tabs/DemographicsTab.tsx`
- Create: `er-portal/src/components/tabs/PresentingComplaintTab.tsx`
- Create: `er-portal/src/components/tabs/ABCDETab.tsx`
- Create: `er-portal/src/components/tabs/PhysicalExamTab.tsx`
- Create: `er-portal/src/components/tabs/InvestigationsTab.tsx`
- Create: `er-portal/src/components/tabs/TreatmentTab.tsx`
- Create: `er-portal/src/components/tabs/DispositionTab.tsx`

Each tab component receives `patient` (current state) and `onChange(field, value)` callback.

- [ ] **Step 1: Create a shared field helper component**

Create `er-portal/src/components/tabs/FormField.tsx`:

```tsx
interface TextFieldProps {
  label: string;
  field: string;
  value: string | number | null | undefined;
  onChange: (field: string, value: any) => void;
  type?: "text" | "number" | "datetime-local";
  placeholder?: string;
}

export function TextField({ label, field, value, onChange, type = "text", placeholder }: TextFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  field: string;
  value: string | null | undefined;
  onChange: (field: string, value: any) => void;
  rows?: number;
  placeholder?: string;
}

export function TextAreaField({ label, field, value, onChange, rows = 3, placeholder }: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  field: string;
  value: string | null | undefined;
  onChange: (field: string, value: any) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, field, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field, e.target.value || null)}
        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  field: string;
  checked: boolean;
  onChange: (field: string, value: boolean) => void;
}

export function CheckboxField({ label, field, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(field, e.target.checked)}
        className="rounded border-gray-300"
      />
      {label}
    </label>
  );
}
```

- [ ] **Step 2: Create DemographicsTab**

Create `er-portal/src/components/tabs/DemographicsTab.tsx`:

```tsx
import { TextField, TextAreaField, SelectField } from "./FormField";

interface Props {
  patient: any;
  beds: any[];
  doctors: any[];
  onChange: (field: string, value: any) => void;
}

export default function DemographicsTab({ patient, beds, doctors, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Patient Name" field="name" value={patient.name} onChange={onChange} />
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Age" field="age" value={patient.age} onChange={onChange} type="number" />
          <SelectField
            label="Gender"
            field="gender"
            value={patient.gender}
            onChange={onChange}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
            ]}
          />
        </div>
        <TextField label="NID / Passport" field="nidPassport" value={patient.nidPassport} onChange={onChange} />
        <TextField label="Hospital Number" field="hospitalNumber" value={patient.hospitalNumber} onChange={onChange} />
        <SelectField
          label="ER Bed"
          field="bedId"
          value={patient.bedId}
          onChange={onChange}
          options={beds.map((b: any) => ({ value: b.id, label: b.name }))}
        />
        <TextField
          label="Arrival Date & Time"
          field="arrivalDateTime"
          value={patient.arrivalDateTime ? new Date(patient.arrivalDateTime).toISOString().slice(0, 16) : ""}
          onChange={onChange}
          type="datetime-local"
        />
        <TextField label="Referred By" field="referredBy" value={patient.referredBy} onChange={onChange} placeholder="Self / Clinic / etc." />
        <SelectField
          label="Attending Doctor"
          field="attendingDoctorId"
          value={patient.attendingDoctorId}
          onChange={onChange}
          options={doctors.map((d: any) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <hr className="border-gray-200" />

      <div className="grid grid-cols-3 gap-4">
        <TextAreaField label="Underlying Medical Conditions" field="underlyingConditions" value={patient.underlyingConditions} onChange={onChange} placeholder="Known case of..." />
        <TextAreaField label="Regular Medications" field="regularMedications" value={patient.regularMedications} onChange={onChange} />
        <TextField label="Allergy History" field="allergyHistory" value={patient.allergyHistory} onChange={onChange} placeholder="NKDA / NKFA" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Last Meal" field="lastMeal" value={patient.lastMeal} onChange={onChange} />
        <TextField label="LMP" field="lmp" value={patient.lmp} onChange={onChange} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PresentingComplaintTab**

Create `er-portal/src/components/tabs/PresentingComplaintTab.tsx`:

```tsx
import { TextAreaField } from "./FormField";

interface Props {
  patient: any;
  onChange: (field: string, value: any) => void;
}

export default function PresentingComplaintTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextAreaField label="Chief Complaints" field="chiefComplaints" value={patient.chiefComplaints} onChange={onChange} rows={3} />
      <TextAreaField label="History of Presenting Illness" field="historyOfPresentingIllness" value={patient.historyOfPresentingIllness} onChange={onChange} rows={6} />
    </div>
  );
}
```

- [ ] **Step 4: Create ABCDETab**

Create `er-portal/src/components/tabs/ABCDETab.tsx`:

```tsx
import { TextField } from "./FormField";

interface Props {
  patient: any;
  onChange: (field: string, value: any) => void;
}

export default function ABCDETab({ patient, onChange }: Props) {
  const gcsTotal = (patient.gcsE || 0) + (patient.gcsV || 0) + (patient.gcsM || 0);

  return (
    <div className="space-y-6">
      {/* A - Airway */}
      <div>
        <h3 className="text-sm font-bold text-red-700 mb-2">A — Airway</h3>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Speech / Added Sounds" field="airwaySpeech" value={patient.airwaySpeech} onChange={onChange} />
          <TextField label="SpO2 %" field="spo2Percent" value={patient.spo2Percent} onChange={onChange} type="number" />
          <TextField label="SpO2 Per Liter" field="spo2PerLiter" value={patient.spo2PerLiter} onChange={onChange} placeholder="RA / 2L NP" />
        </div>
      </div>

      {/* B - Breathing */}
      <div>
        <h3 className="text-sm font-bold text-orange-700 mb-2">B — Breathing</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="RR /min" field="rr" value={patient.rr} onChange={onChange} type="number" />
          <TextField label="Chest Findings" field="chestFindings" value={patient.chestFindings} onChange={onChange} />
        </div>
      </div>

      {/* C - Circulation */}
      <div>
        <h3 className="text-sm font-bold text-yellow-700 mb-2">C — Circulation</h3>
        <div className="grid grid-cols-4 gap-4">
          <TextField label="PR /min" field="pr" value={patient.pr} onChange={onChange} type="number" />
          <TextField label="BP mmHg" field="bp" value={patient.bp} onChange={onChange} placeholder="120/80" />
          <TextField label="Heart Sounds" field="heartSounds" value={patient.heartSounds} onChange={onChange} placeholder="S1S2M0" />
          <TextField label="GRBS mg/dL" field="grbs" value={patient.grbs} onChange={onChange} type="number" />
        </div>
      </div>

      {/* D - Disability */}
      <div>
        <h3 className="text-sm font-bold text-blue-700 mb-2">D — Disability</h3>
        <div className="grid grid-cols-4 gap-4 mb-2">
          <TextField label="GCS E (1-4)" field="gcsE" value={patient.gcsE} onChange={onChange} type="number" />
          <TextField label="GCS V (1-5)" field="gcsV" value={patient.gcsV} onChange={onChange} type="number" />
          <TextField label="GCS M (1-6)" field="gcsM" value={patient.gcsM} onChange={onChange} type="number" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">GCS Total</label>
            <div className="px-2 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-bold">
              {gcsTotal || "—"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 grid grid-cols-2 gap-4">
            <TextField label="Pupil Diameter — Right" field="pupilDiameterR" value={patient.pupilDiameterR} onChange={onChange} />
            <TextField label="Pupil Diameter — Left" field="pupilDiameterL" value={patient.pupilDiameterL} onChange={onChange} />
          </div>
          <div className="col-span-3 grid grid-cols-2 gap-4">
            <TextField label="Reaction to Light — Right" field="pupilReactionR" value={patient.pupilReactionR} onChange={onChange} />
            <TextField label="Reaction to Light — Left" field="pupilReactionL" value={patient.pupilReactionL} onChange={onChange} />
          </div>
          <div className="col-span-3 grid grid-cols-2 gap-4">
            <TextField label="Corneal Reflex — Right" field="cornealReflexR" value={patient.cornealReflexR} onChange={onChange} />
            <TextField label="Corneal Reflex — Left" field="cornealReflexL" value={patient.cornealReflexL} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* E - Exposure */}
      <div>
        <h3 className="text-sm font-bold text-green-700 mb-2">E — Exposure</h3>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <TextField label="Upper Limb — Right" field="ulRight" value={patient.ulRight} onChange={onChange} />
          <TextField label="Upper Limb — Left" field="ulLeft" value={patient.ulLeft} onChange={onChange} />
          <TextField label="Lower Limb — Right" field="llRight" value={patient.llRight} onChange={onChange} />
          <TextField label="Lower Limb — Left" field="llLeft" value={patient.llLeft} onChange={onChange} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="Temperature °C" field="tempC" value={patient.tempC} onChange={onChange} type="number" />
          <TextField label="Abdomen / Log Roll" field="abdomenLogRoll" value={patient.abdomenLogRoll} onChange={onChange} />
          <TextField label="DRE" field="dre" value={patient.dre} onChange={onChange} />
        </div>
        <div className="mt-2">
          <TextField label="Bedside USG" field="bedsideUsg" value={patient.bedsideUsg} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create PhysicalExamTab**

Create `er-portal/src/components/tabs/PhysicalExamTab.tsx`:

```tsx
import { TextField, TextAreaField } from "./FormField";

interface Props {
  patient: any;
  onChange: (field: string, value: any) => void;
}

export default function PhysicalExamTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextField label="General Condition" field="physicalExamGC" value={patient.physicalExamGC} onChange={onChange} placeholder="fair / in pain / etc." />
      <TextAreaField label="O/E Findings" field="physicalExamFindings" value={patient.physicalExamFindings} onChange={onChange} rows={8} placeholder="Detailed examination findings..." />
    </div>
  );
}
```

- [ ] **Step 6: Create InvestigationsTab**

Create `er-portal/src/components/tabs/InvestigationsTab.tsx`:

```tsx
import { CheckboxField, TextField } from "./FormField";

interface Props {
  patient: any;
  onChange: (field: string, value: any) => void;
}

export default function InvestigationsTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Blood</h3>
        <div className="grid grid-cols-3 gap-3">
          <CheckboxField label="CBC" field="invCBC" checked={patient.invCBC} onChange={onChange} />
          <CheckboxField label="LFT" field="invLFT" checked={patient.invLFT} onChange={onChange} />
          <CheckboxField label="RFT" field="invRFT" checked={patient.invRFT} onChange={onChange} />
          <CheckboxField label="Electrolytes" field="invElectrolytes" checked={patient.invElectrolytes} onChange={onChange} />
          <CheckboxField label="Cardiac Markers" field="invCardiacMarkers" checked={patient.invCardiacMarkers} onChange={onChange} />
          <CheckboxField label="CRP" field="invCRP" checked={patient.invCRP} onChange={onChange} />
          <CheckboxField label="Dengue" field="invDengue" checked={patient.invDengue} onChange={onChange} />
          <CheckboxField label="RBS" field="invRBS" checked={patient.invRBS} onChange={onChange} />
          <CheckboxField label="S.BHCG / UPT" field="invBHCG" checked={patient.invBHCG} onChange={onChange} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Urine</h3>
        <div className="grid grid-cols-3 gap-3">
          <CheckboxField label="Routine" field="invUrineRoutine" checked={patient.invUrineRoutine} onChange={onChange} />
          <CheckboxField label="Culture" field="invUrineCulture" checked={patient.invUrineCulture} onChange={onChange} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Radiology</h3>
        <div className="grid grid-cols-3 gap-3">
          <CheckboxField label="ECG" field="invECG" checked={patient.invECG} onChange={onChange} />
          <CheckboxField label="X-ray" field="invXray" checked={patient.invXray} onChange={onChange} />
          <CheckboxField label="USG" field="invUSG" checked={patient.invUSG} onChange={onChange} />
          <CheckboxField label="Doppler" field="invDoppler" checked={patient.invDoppler} onChange={onChange} />
          <CheckboxField label="CT" field="invCT" checked={patient.invCT} onChange={onChange} />
          <CheckboxField label="MRI" field="invMRI" checked={patient.invMRI} onChange={onChange} />
        </div>
      </div>

      <TextField label="Others" field="invOthers" value={patient.invOthers} onChange={onChange} placeholder="Other investigations..." />
    </div>
  );
}
```

- [ ] **Step 7: Create TreatmentTab**

Create `er-portal/src/components/tabs/TreatmentTab.tsx`:

```tsx
import { TextAreaField } from "./FormField";

interface Props {
  patient: any;
  onChange: (field: string, value: any) => void;
}

export default function TreatmentTab({ patient, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextAreaField label="Working Diagnosis" field="workingDiagnosis" value={patient.workingDiagnosis} onChange={onChange} rows={3} />
      <TextAreaField label="Initial Treatment" field="initialTreatment" value={patient.initialTreatment} onChange={onChange} rows={4} />
      <TextAreaField label="Course of Management in ER" field="courseOfManagement" value={patient.courseOfManagement} onChange={onChange} rows={6} placeholder="Running notes..." />
      <TextAreaField label="In-Hospital Referrals and Outcomes" field="referralsOutcomes" value={patient.referralsOutcomes} onChange={onChange} rows={4} />
    </div>
  );
}
```

- [ ] **Step 8: Create DispositionTab**

Create `er-portal/src/components/tabs/DispositionTab.tsx`:

```tsx
import { TextField, TextAreaField, SelectField } from "./FormField";

interface Props {
  patient: any;
  doctors: any[];
  onChange: (field: string, value: any) => void;
}

export default function DispositionTab({ patient, doctors, onChange }: Props) {
  const checklistItems = [
    { field: "clMedications", label: "Medications" },
    { field: "clPrescription", label: "Prescription" },
    { field: "clLabReports", label: "Lab Reports" },
    { field: "clXrayEcg", label: "X-rays and CT scan CD / ECG" },
    { field: "clCtMriUsg", label: "CT/MRI/USG Report" },
    { field: "clMedCerts", label: "Medical Certificates" },
    { field: "clOldDocs", label: "Patient's Old Documents" },
  ];

  return (
    <div className="space-y-6">
      {/* Disposition */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Disposition"
          field="dispositionType"
          value={patient.dispositionType}
          onChange={onChange}
          options={[
            { value: "DISCHARGED_ER", label: "Discharged by ER" },
            { value: "ADMITTED", label: "Admitted" },
            { value: "REFERRED", label: "Referred" },
            { value: "DISCHARGED_REFERRED", label: "Discharged by Referred Dept" },
          ]}
        />
        <TextField
          label="Discharge Date & Time"
          field="dischargeDatetime"
          value={patient.dischargeDatetime ? new Date(patient.dischargeDatetime).toISOString().slice(0, 16) : ""}
          onChange={onChange}
          type="datetime-local"
        />
      </div>

      {/* Discharge Vitals */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Vitals at Discharge</h3>
        <div className="grid grid-cols-3 gap-4">
          <TextField label="GC" field="dcGC" value={patient.dcGC} onChange={onChange} placeholder="fair" />
          <TextField label="HR (bpm)" field="dcHR" value={patient.dcHR} onChange={onChange} type="number" />
          <TextField label="RR (/min)" field="dcRR" value={patient.dcRR} onChange={onChange} type="number" />
          <TextField label="BP (mmHg)" field="dcBP" value={patient.dcBP} onChange={onChange} placeholder="120/80" />
          <TextField label="SpO2" field="dcSpo2" value={patient.dcSpo2} onChange={onChange} placeholder="99% under RA" />
          <TextField label="Temp °C" field="dcTemp" value={patient.dcTemp} onChange={onChange} type="number" />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-2">
          <TextField label="Chest" field="dcChest" value={patient.dcChest} onChange={onChange} />
          <TextField label="CVS" field="dcCVS" value={patient.dcCVS} onChange={onChange} />
          <TextField label="Abdomen" field="dcAbdomen" value={patient.dcAbdomen} onChange={onChange} />
          <TextField label="CNS" field="dcCNS" value={patient.dcCNS} onChange={onChange} />
        </div>
      </div>

      {/* Discharge Instructions */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Discharge Instructions</h3>
        <div className="space-y-3">
          <TextAreaField label="Medications" field="dcMedications" value={patient.dcMedications} onChange={onChange} rows={3} />
          <TextAreaField label="Advice" field="dcAdvice" value={patient.dcAdvice} onChange={onChange} rows={3} />
          <TextField label="Follow Up" field="dcFollowUp" value={patient.dcFollowUp} onChange={onChange} placeholder="Follow up in surgery OPD in 3 days" />
        </div>
      </div>

      {/* Discharged by */}
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Discharged By"
          field="dcDoctorId"
          value={patient.dcDoctorId}
          onChange={onChange}
          options={doctors.map((d: any) => ({ value: d.id, label: d.name }))}
        />
        <div />
        <TextField label="Condition Explained To — Name" field="dcExplainedToName" value={patient.dcExplainedToName} onChange={onChange} />
        <TextField label="Relation to Patient" field="dcExplainedToRelation" value={patient.dcExplainedToRelation} onChange={onChange} />
      </div>

      {/* Discharge Checklist */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Discharge Checklist</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border">Item</th>
              <th className="p-2 border w-16">Yes</th>
              <th className="p-2 border w-16">No</th>
              <th className="p-2 border w-16">N/A</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item) => (
              <tr key={item.field}>
                <td className="p-2 border">{item.label}</td>
                {["YES", "NO", "NA"].map((val) => (
                  <td key={val} className="p-2 border text-center">
                    <input
                      type="radio"
                      name={item.field}
                      checked={patient[item.field] === val}
                      onChange={() => onChange(item.field, val)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Received by */}
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Received By — Name" field="dcReceivedByName" value={patient.dcReceivedByName} onChange={onChange} />
        <TextField label="Attending Nurse" field="dcAttendingNurse" value={patient.dcAttendingNurse} onChange={onChange} />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add all 7 tab components for patient record"
```

---

### Task 4: Patient Record Page

**Files:**
- Create: `er-portal/src/app/patients/[id]/page.tsx`

- [ ] **Step 1: Create the patient record page with tabs**

Create `er-portal/src/app/patients/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAutoSave } from "@/hooks/useAutoSave";
import DemographicsTab from "@/components/tabs/DemographicsTab";
import PresentingComplaintTab from "@/components/tabs/PresentingComplaintTab";
import ABCDETab from "@/components/tabs/ABCDETab";
import PhysicalExamTab from "@/components/tabs/PhysicalExamTab";
import InvestigationsTab from "@/components/tabs/InvestigationsTab";
import TreatmentTab from "@/components/tabs/TreatmentTab";
import DispositionTab from "@/components/tabs/DispositionTab";

const TABS = [
  "Demographics",
  "Presenting Complaint",
  "ABCDE Assessment",
  "Physical Exam",
  "Investigations",
  "Treatment & Course",
  "Disposition",
];

export default function PatientRecordPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [beds, setBeds] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const { updateField, flushNow, saveStatus } = useAutoSave(patientId);

  useEffect(() => {
    async function load() {
      const [patientRes, bedsRes, doctorsRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch("/api/beds"),
        fetch("/api/doctors"),
      ]);
      if (patientRes.ok) setPatient(await patientRes.json());
      if (bedsRes.ok) setBeds(await bedsRes.json());
      if (doctorsRes.ok) setDoctors(await doctorsRes.json());
      setLoading(false);
    }
    load();
  }, [patientId]);

  function handleChange(field: string, value: any) {
    setPatient((prev: any) => ({ ...prev, [field]: value }));
    updateField(field, value);
  }

  function handleBack() {
    flushNow();
    router.push("/");
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[80vh] text-gray-500">Loading patient...</div>;
  }

  if (!patient) {
    return <div className="flex items-center justify-center min-h-[80vh] text-red-500">Patient not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Patient Banner */}
      <div className="bg-slate-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="text-slate-400 hover:text-white text-sm">
            ← Dashboard
          </button>
          <div>
            <span className="font-bold text-lg">{patient.name || "New Patient"}</span>
            <span className="text-slate-400 text-sm ml-2">
              {patient.age && `${patient.age}`}
              {patient.gender && patient.gender[0]}
              {patient.nidPassport && ` · ${patient.nidPassport}`}
              {patient.bed && ` · ${patient.bed.name}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved ✓"}
            {saveStatus === "error" && "Save failed!"}
          </span>
          <a
            href={`/api/patients/${patientId}/export/observation`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded"
          >
            📄 Export Observation Chart
          </a>
          <a
            href={`/api/patients/${patientId}/export/discharge`}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded"
          >
            📋 Export Discharge Summary
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="flex px-6 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? "border-blue-600 text-blue-600 font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 0 && <DemographicsTab patient={patient} beds={beds} doctors={doctors} onChange={handleChange} />}
        {activeTab === 1 && <PresentingComplaintTab patient={patient} onChange={handleChange} />}
        {activeTab === 2 && <ABCDETab patient={patient} onChange={handleChange} />}
        {activeTab === 3 && <PhysicalExamTab patient={patient} onChange={handleChange} />}
        {activeTab === 4 && <InvestigationsTab patient={patient} onChange={handleChange} />}
        {activeTab === 5 && <TreatmentTab patient={patient} onChange={handleChange} />}
        {activeTab === 6 && <DispositionTab patient={patient} doctors={doctors} onChange={handleChange} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add patient record page with tabbed interface and auto-save"
```

---

### Task 5: New Patient Page

**Files:**
- Create: `er-portal/src/app/patients/new/page.tsx`

- [ ] **Step 1: Create new patient page**

Create `er-portal/src/app/patients/new/page.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function NewPatientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBed = searchParams.get("bed") || "";

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || "New Patient",
        bedId: preselectedBed || null,
      }),
    });

    if (res.ok) {
      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <form onSubmit={handleCreate} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Register New Patient</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter patient name"
            autoFocus
          />
        </div>
        <p className="text-xs text-gray-500">You can fill in all other details on the next screen.</p>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create & Open Record"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Test the full flow**

1. Open http://localhost:3000, log in
2. Click "+ New Patient" → enter a name → click Create
3. Should redirect to patient record with 7 tabs
4. Fill in fields across tabs — should see "Saving..." then "Saved ✓"
5. Navigate back to dashboard — patient should show on their bed
6. Click the bed card — should reopen the patient with all saved data

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add new patient creation page"
```
