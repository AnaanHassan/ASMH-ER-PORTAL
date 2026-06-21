# ER Portal — Part 4: Document Export (.docx)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate ER Observation Chart and Discharge Summary as .docx files with the AMSH hospital letterhead, matching the existing template formats.

**Architecture:** Server-side API routes use the `docx` npm package to build Word documents programmatically. Hospital logo image is stored in `public/images/` and embedded in the header. Each export endpoint fetches the patient, builds the document, and returns it as a downloadable .docx file.

**Tech Stack:** docx (npm package), Next.js API routes

**Depends on:** Parts 1-3

---

### Task 1: Extract Logo and Install docx

**Files:**
- Create: `er-portal/public/images/hospital-logo.jpg`

- [ ] **Step 1: Install docx package**

```bash
cd "/Users/anaan/Desktop/AMSH ER/er-portal"
npm install docx
```

- [ ] **Step 2: Extract logo from existing template**

```bash
cd "/Users/anaan/Desktop/AMSH ER"
python3 -c "
import zipfile, shutil
with zipfile.ZipFile('new ER Observation Chart.docx') as z:
    z.extract('word/media/image1.jpg', '/tmp/logo_extract/')
shutil.copy('/tmp/logo_extract/word/media/image1.jpg', 'er-portal/public/images/hospital-logo.jpg')
print('Logo extracted')
"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add docx package and hospital logo"
```

---

### Task 2: Shared Letterhead Builder

**Files:**
- Create: `er-portal/src/lib/docx/letterhead.ts`

- [ ] **Step 1: Create letterhead module**

Create `er-portal/src/lib/docx/letterhead.ts`:

```typescript
import {
  Header,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  TabStopType,
  TabStopPosition,
} from "docx";
import fs from "fs";
import path from "path";

export function createLetterheadHeader(subtitle: string) {
  const logoPath = path.join(process.cwd(), "public/images/hospital-logo.jpg");
  const logoBuffer = fs.readFileSync(logoPath);

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: "jpg",
            data: logoBuffer,
            transformation: { width: 500, height: 80 },
            altText: {
              title: "AMSH Logo",
              description: "Dr. Abdul Samad Memorial Hospital Logo",
              name: "hospital-logo",
            },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: "DEPARTMENT OF EMERGENCY AND TRAUMA",
            bold: true,
            size: 20,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: subtitle,
            bold: true,
            size: 24,
            font: "Arial",
          }),
        ],
      }),
    ],
  });
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function textRun(text: string, options?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text,
    font: "Arial",
    size: options?.size ?? 20,
    bold: options?.bold ?? false,
  });
}

export function labelValue(label: string, value: string | number | null | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      textRun(`${label}: `, { bold: true }),
      textRun(String(value ?? "")),
    ],
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add shared letterhead builder for docx export"
```

---

### Task 3: ER Observation Chart Export

**Files:**
- Create: `er-portal/src/lib/docx/observationChart.ts`
- Create: `er-portal/src/app/api/patients/[id]/export/observation/route.ts`

- [ ] **Step 1: Create observation chart builder**

Create `er-portal/src/lib/docx/observationChart.ts`:

```typescript
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  PageBreak,
} from "docx";
import { createLetterheadHeader, formatDateTime, textRun, labelValue } from "./letterhead";

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 40, bottom: 40, left: 80, right: 80 };

function cell(text: string, width: number, bold = false): TableCell {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [textRun(text, { bold })] })],
  });
}

export async function buildObservationChart(patient: any): Promise<Buffer> {
  const gcsTotal = (patient.gcsE || 0) + (patient.gcsV || 0) + (patient.gcsM || 0);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 2200, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: createLetterheadHeader("PATIENT RECORD"),
        },
        children: [
          // Demographics table
          new Table({
            width: { size: 10800, type: WidthType.DXA },
            columnWidths: [2700, 2700, 2700, 2700],
            rows: [
              new TableRow({
                children: [
                  cell(`Patient Name: ${patient.name || ""}`, 2700, true),
                  cell(`Age: ${patient.age || ""} ${patient.gender || ""}`, 2700),
                  cell(`NID: ${patient.nidPassport || ""}`, 2700),
                  cell(`Hospital No: ${patient.hospitalNumber || ""}`, 2700),
                ],
              }),
              new TableRow({
                children: [
                  cell(`ER Bed: ${patient.bed?.name || ""}`, 2700),
                  cell(`Arrival: ${formatDateTime(patient.arrivalDateTime)}`, 2700),
                  cell(`Referred By: ${patient.referredBy || ""}`, 2700),
                  cell(`Doctor: ${patient.attendingDoctor?.name || ""}`, 2700),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200 }, children: [] }),

          // History section
          labelValue("Underlying Medical Conditions", patient.underlyingConditions),
          labelValue("Regular Medications", patient.regularMedications),
          labelValue("Allergy History", patient.allergyHistory),
          labelValue("Last Meal", patient.lastMeal),
          labelValue("LMP", patient.lmp),

          new Paragraph({ spacing: { before: 200 }, children: [] }),

          labelValue("Chief Complaints", patient.chiefComplaints),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("History of Presenting Illness: ", { bold: true }),
              textRun(patient.historyOfPresentingIllness || ""),
            ],
          }),

          new Paragraph({ spacing: { before: 200 }, children: [textRun("ABCDE ASSESSMENT", { bold: true, size: 22 })] }),

          // ABCDE table
          new Table({
            width: { size: 10800, type: WidthType.DXA },
            columnWidths: [1800, 2000, 1800, 2000, 1600, 1600],
            rows: [
              new TableRow({ children: [
                cell("A - Airway", 1800, true), cell(`Speech: ${patient.airwaySpeech || ""}`, 2000),
                cell(`SpO2: ${patient.spo2Percent ?? ""}%`, 1800), cell(`On: ${patient.spo2PerLiter || ""}`, 2000),
                cell("", 1600), cell("", 1600),
              ]}),
              new TableRow({ children: [
                cell("B - Breathing", 1800, true), cell(`RR: ${patient.rr ?? ""}/min`, 2000),
                cell(`Chest: ${patient.chestFindings || ""}`, 1800), cell("", 2000),
                cell("", 1600), cell("", 1600),
              ]}),
              new TableRow({ children: [
                cell("C - Circulation", 1800, true), cell(`PR: ${patient.pr ?? ""}/min`, 2000),
                cell(`BP: ${patient.bp || ""}`, 1800), cell(`Heart: ${patient.heartSounds || ""}`, 2000),
                cell(`GRBS: ${patient.grbs ?? ""}`, 1600), cell("", 1600),
              ]}),
              new TableRow({ children: [
                cell("D - Disability", 1800, true),
                cell(`GCS: E${patient.gcsE ?? ""} V${patient.gcsV ?? ""} M${patient.gcsM ?? ""} = ${gcsTotal || ""}`, 2000),
                cell(`Pupils R: ${patient.pupilDiameterR || ""}`, 1800),
                cell(`Pupils L: ${patient.pupilDiameterL || ""}`, 2000),
                cell(`React R: ${patient.pupilReactionR || ""}`, 1600),
                cell(`React L: ${patient.pupilReactionL || ""}`, 1600),
              ]}),
              new TableRow({ children: [
                cell("E - Exposure", 1800, true), cell(`Temp: ${patient.tempC ?? ""}°C`, 2000),
                cell(`Abd: ${patient.abdomenLogRoll || ""}`, 1800), cell(`DRE: ${patient.dre || ""}`, 2000),
                cell(`USG: ${patient.bedsideUsg || ""}`, 1600), cell("", 1600),
              ]}),
            ],
          }),

          // Page break for page 2
          new Paragraph({ children: [new PageBreak()] }),

          // Physical Examination
          new Paragraph({ spacing: { after: 100 }, children: [textRun("PHYSICAL EXAMINATION", { bold: true, size: 22 })] }),
          labelValue("General Condition", patient.physicalExamGC),
          new Paragraph({ spacing: { after: 100 }, children: [textRun(patient.physicalExamFindings || "")] }),

          new Paragraph({ spacing: { before: 200 }, children: [] }),

          // Working Diagnosis & Treatment
          labelValue("Working Diagnosis", patient.workingDiagnosis),
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [textRun("Initial Treatment:", { bold: true })],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [textRun(patient.initialTreatment || "")] }),

          // Investigations
          new Paragraph({ spacing: { before: 200 }, children: [textRun("INVESTIGATIONS ORDERED", { bold: true, size: 22 })] }),
          new Paragraph({
            spacing: { after: 100 },
            children: [textRun(buildInvestigationsList(patient))],
          }),

          // Disposition
          new Paragraph({ spacing: { before: 200 }, children: [textRun("DISPOSITION", { bold: true, size: 22 })] }),
          labelValue("Disposition", formatDisposition(patient.dispositionType)),

          new Paragraph({ spacing: { before: 200 }, children: [] }),
          labelValue("Name of Attending Doctor", patient.attendingDoctor?.name),
          new Paragraph({ spacing: { before: 60 }, children: [textRun("Signature:")] }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

function buildInvestigationsList(p: any): string {
  const items: string[] = [];
  if (p.invCBC) items.push("CBC");
  if (p.invLFT) items.push("LFT");
  if (p.invRFT) items.push("RFT");
  if (p.invElectrolytes) items.push("Electrolytes");
  if (p.invCardiacMarkers) items.push("Cardiac Markers");
  if (p.invCRP) items.push("CRP");
  if (p.invDengue) items.push("Dengue");
  if (p.invRBS) items.push("RBS");
  if (p.invBHCG) items.push("S.BHCG/UPT");
  if (p.invUrineRoutine) items.push("Urine Routine");
  if (p.invUrineCulture) items.push("Urine Culture");
  if (p.invECG) items.push("ECG");
  if (p.invXray) items.push("X-ray");
  if (p.invUSG) items.push("USG");
  if (p.invDoppler) items.push("Doppler");
  if (p.invCT) items.push("CT");
  if (p.invMRI) items.push("MRI");
  if (p.invOthers) items.push(p.invOthers);
  return items.length > 0 ? items.join(", ") : "None";
}

function formatDisposition(type: string | null): string {
  const map: Record<string, string> = {
    DISCHARGED_ER: "Discharged by ER",
    ADMITTED: "Admitted",
    REFERRED: "Referred",
    DISCHARGED_REFERRED: "Discharged by Referred Department",
  };
  return map[type || ""] || "";
}
```

- [ ] **Step 2: Create the API route**

Create `er-portal/src/app/api/patients/[id]/export/observation/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildObservationChart } from "@/lib/docx/observationChart";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      bed: true,
      attendingDoctor: { select: { name: true } },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await buildObservationChart(patient);
  const filename = `ER_Observation_${patient.name?.replace(/\s+/g, "_") || "patient"}.docx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add ER observation chart docx export"
```

---

### Task 4: Discharge Summary Export

**Files:**
- Create: `er-portal/src/lib/docx/dischargeSummary.ts`
- Create: `er-portal/src/app/api/patients/[id]/export/discharge/route.ts`

- [ ] **Step 1: Create discharge summary builder**

Create `er-portal/src/lib/docx/dischargeSummary.ts`:

```typescript
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
} from "docx";
import { createLetterheadHeader, formatDateTime, textRun, labelValue } from "./letterhead";

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 40, bottom: 40, left: 80, right: 80 };

function cell(text: string, width: number, bold = false): TableCell {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [textRun(text, { bold })] })],
  });
}

export async function buildDischargeSummary(patient: any): Promise<Buffer> {
  const gcsTotal = (patient.gcsE || 0) + (patient.gcsV || 0) + (patient.gcsM || 0);

  const checklistItems = [
    { label: "Medications", value: patient.clMedications },
    { label: "Prescription", value: patient.clPrescription },
    { label: "Lab Reports", value: patient.clLabReports },
    { label: "X-rays and CT scan CD / ECG", value: patient.clXrayEcg },
    { label: "CT/MRI/USG Report", value: patient.clCtMriUsg },
    { label: "Medical Certificates", value: patient.clMedCerts },
    { label: "Patient's Old Documents", value: patient.clOldDocs },
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 2200, right: 720, bottom: 720, left: 720 },
          },
        },
        headers: {
          default: createLetterheadHeader("ER DISCHARGE SUMMARY"),
        },
        children: [
          // Demographics
          new Table({
            width: { size: 10800, type: WidthType.DXA },
            columnWidths: [5400, 5400],
            rows: [
              new TableRow({ children: [
                cell(`Patient Name: ${patient.name || ""}`, 5400, true),
                cell(`ER Bed: ${patient.bed?.name || ""}`, 5400),
              ]}),
              new TableRow({ children: [
                cell(`Age & Gender: ${patient.age || ""} ${patient.gender || ""}`, 5400),
                cell(`Arrival: ${formatDateTime(patient.arrivalDateTime)}`, 5400),
              ]}),
              new TableRow({ children: [
                cell(`NID / MRN: ${patient.nidPassport || ""} / ${patient.hospitalNumber || ""}`, 5400),
                cell(`Discharge: ${formatDateTime(patient.dischargeDatetime)}`, 5400),
              ]}),
            ],
          }),

          new Paragraph({ spacing: { before: 160 }, children: [] }),

          labelValue("Underlying Medical Conditions", patient.underlyingConditions),
          labelValue("Regular Medications", patient.regularMedications),
          labelValue("Allergy History", patient.allergyHistory),

          new Paragraph({ spacing: { before: 160 }, children: [] }),

          labelValue("Chief Complaints", patient.chiefComplaints),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("History of Presenting Illness: ", { bold: true }),
              textRun(patient.historyOfPresentingIllness || ""),
            ],
          }),

          // Examination - two column: on arrival vs at discharge
          new Paragraph({ spacing: { before: 200 }, children: [textRun("Examination", { bold: true, size: 22 })] }),

          new Table({
            width: { size: 10800, type: WidthType.DXA },
            columnWidths: [5400, 5400],
            rows: [
              new TableRow({ children: [
                cell("On arrival to ER", 5400, true),
                cell("At discharge from ER", 5400, true),
              ]}),
              new TableRow({ children: [
                new TableCell({
                  borders, width: { size: 5400, type: WidthType.DXA }, margins: cellMargins,
                  children: [
                    labelValue("GC", patient.physicalExamGC),
                    labelValue("HR", `${patient.pr ?? ""} bpm`),
                    labelValue("RR", `${patient.rr ?? ""} breaths per minute`),
                    labelValue("BP", `${patient.bp || ""} mmHg`),
                    labelValue("SpO2", `${patient.spo2Percent ?? ""}% under ${patient.spo2PerLiter || "RA"}`),
                    labelValue("Temperature", `${patient.tempC ?? ""}°C`),
                    labelValue("Chest", patient.chestFindings),
                    labelValue("CVS", patient.heartSounds),
                    labelValue("Abdomen", patient.abdomenLogRoll),
                    labelValue("CNS", "Intact"),
                  ],
                }),
                new TableCell({
                  borders, width: { size: 5400, type: WidthType.DXA }, margins: cellMargins,
                  children: [
                    labelValue("GC", patient.dcGC),
                    labelValue("HR", `${patient.dcHR ?? ""} bpm`),
                    labelValue("RR", `${patient.dcRR ?? ""} breaths per minute`),
                    labelValue("BP", `${patient.dcBP || ""} mmHg`),
                    labelValue("SpO2", patient.dcSpo2),
                    labelValue("Temperature", patient.dcTemp ? `${patient.dcTemp}°C` : ""),
                    labelValue("Chest", patient.dcChest),
                    labelValue("CVS", patient.dcCVS),
                    labelValue("Abdomen", patient.dcAbdomen),
                    labelValue("CNS", patient.dcCNS),
                  ],
                }),
              ]}),
            ],
          }),

          new Paragraph({ spacing: { before: 160 }, children: [] }),

          labelValue("Investigations", "All Enclosed"),
          labelValue("Diagnosis", patient.workingDiagnosis),

          new Paragraph({ spacing: { before: 100 }, children: [
            textRun("Course of management in ER:", { bold: true }),
          ]}),
          new Paragraph({ spacing: { after: 60 }, children: [textRun(patient.courseOfManagement || "")] }),

          new Paragraph({
            spacing: { after: 60 },
            children: [textRun("The patient is being discharged from emergency room in a hemodynamically stable state with the following advice.", { size: 18 })],
          }),

          labelValue("In hospital referrals and outcomes", patient.referralsOutcomes),

          // Discharge Instructions
          new Paragraph({ spacing: { before: 200 }, children: [textRun("Discharge Instructions", { bold: true, size: 22 })] }),
          new Paragraph({ spacing: { after: 60 }, children: [
            textRun("Medications: ", { bold: true }), textRun(patient.dcMedications || ""),
          ]}),
          new Paragraph({ spacing: { after: 60 }, children: [
            textRun("Advice: ", { bold: true }), textRun(patient.dcAdvice || ""),
          ]}),
          new Paragraph({ spacing: { after: 60 }, children: [
            textRun("Follow Up: ", { bold: true }), textRun(patient.dcFollowUp || ""),
          ]}),

          new Paragraph({ spacing: { before: 160 }, children: [] }),
          labelValue("Attending Doctor(s)", patient.attendingDoctor?.name),
          labelValue("Discharged by", patient.dcDoctor?.name),
          new Paragraph({ spacing: { after: 60 }, children: [textRun("Sign and stamp:")] }),

          new Paragraph({ spacing: { before: 100 }, children: [] }),
          labelValue("Condition explained to", patient.dcExplainedToName),
          labelValue("Relation to patient", patient.dcExplainedToRelation),

          // Discharge Checklist
          new Paragraph({ spacing: { before: 200 }, children: [textRun("DISCHARGE CHECKLIST", { bold: true, size: 22 })] }),
          new Paragraph({ spacing: { after: 60 }, children: [textRun("Items returned to patient/relatives", { bold: true, size: 18 })] }),

          new Table({
            width: { size: 10800, type: WidthType.DXA },
            columnWidths: [5400, 1800, 1800, 1800],
            rows: [
              new TableRow({ children: [
                cell("Item", 5400, true),
                cell("Yes", 1800, true),
                cell("No", 1800, true),
                cell("N/A", 1800, true),
              ]}),
              ...checklistItems.map((item) =>
                new TableRow({ children: [
                  cell(item.label, 5400),
                  cell(item.value === "YES" ? "✓" : "", 1800),
                  cell(item.value === "NO" ? "✓" : "", 1800),
                  cell(item.value === "NA" ? "✓" : "", 1800),
                ]})
              ),
            ],
          }),

          new Paragraph({ spacing: { before: 160 }, children: [] }),
          labelValue("Received by", patient.dcReceivedByName),
          labelValue("Attending Nurse", patient.dcAttendingNurse),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
```

- [ ] **Step 2: Create the API route**

Create `er-portal/src/app/api/patients/[id]/export/discharge/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDischargeSummary } from "@/lib/docx/dischargeSummary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      bed: true,
      attendingDoctor: { select: { name: true } },
      dcDoctor: { select: { name: true } },
    },
  });

  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await buildDischargeSummary(patient);
  const filename = `Discharge_Summary_${patient.name?.replace(/\s+/g, "_") || "patient"}.docx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 3: Test both exports**

1. Open a patient record in the portal
2. Click "Export Observation Chart" → .docx should download with letterhead and all patient data
3. Fill in disposition tab, click "Export Discharge Summary" → .docx should download with arrival + discharge vitals side by side
4. Open both in Word/LibreOffice and verify they match the original template structure

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add discharge summary docx export"
```
