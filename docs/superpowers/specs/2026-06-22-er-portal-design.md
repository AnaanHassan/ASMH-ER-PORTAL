# AMSH ER Portal — Design Spec

## Overview

A web portal for Dr. Abdul Samad Memorial Hospital (G.DH. Thinadhoo, Maldives) Emergency & Trauma department. The portal unifies the ER Observation Chart and Discharge Summary into a single workflow, eliminating duplicate data entry. It provides a real-time bed board dashboard and exports clinical documents as .docx files with the hospital letterhead.

## Tech Stack

- **Framework:** Next.js (App Router) — single project for frontend + API
- **Database:** SQLite via Prisma ORM — no separate database server needed
- **Auth:** NextAuth.js with credential-based login (username/password)
- **Document Export:** docx-js (npm `docx` package) for .docx generation
- **Styling:** Tailwind CSS
- **Deployment:** Single machine on hospital network

## Users

- ER doctors (multiple, concurrent)
- Admin role for managing doctor accounts
- No patient-facing functionality

## Authentication

- Login page with username and password
- Passwords hashed with bcrypt
- Session-based auth via NextAuth.js
- Admin can create, edit, and deactivate doctor accounts
- Each doctor has: name, username, password, role (doctor/admin)

## Feature 1: ER Dashboard (Bed Board)

The main screen after login. Shows all ER positions in a visual grid.

### Positions (fixed layout, not configurable)

| Position | Zone Color | Room |
|----------|-----------|------|
| RESUS | Red | — |
| Bed 2 (Receiving) | Pink | — |
| TRAUMA | Pink | R3 |
| Bed 3 | Yellow | R3 |
| Bed 4 | Yellow | R1 |
| Bed 5 | Yellow | R1 |
| Bed 6 | Yellow | R2 |
| Bed 7 | Yellow | R2 |
| Triage Chair | Blue | — |

### Bed Card Display

Each occupied bed shows:
- Patient name, age, gender
- Chief complaint (truncated)
- Arrival time
- Attending doctor name
- Status badge: "PENDING DC" when disposition is set to discharge but not yet completed

Empty beds show "Available" with dashed border.

### Interactions

- Click occupied bed → navigate to patient record
- Click empty bed → open new patient form with that bed pre-selected
- "+ New Patient" button → open new patient form with bed selection
- Top bar shows: occupancy count (e.g., "6/9 beds occupied"), logged-in doctor name

### Data Freshness

Dashboard polls the API every 30 seconds to reflect changes made by other doctors. No WebSocket needed at this scale.

## Feature 2: Patient Record

A tabbed form for entering all clinical data. All fields auto-save on change (debounced 500ms) — switching between patients never loses data.

### Tab 1: Demographics

- Patient name (text)
- Age (number) + Gender (select: Male/Female)
- NID / Passport number (text)
- Hospital number / MRN (text)
- ER Bed (select — dropdown of all positions)
- Arrival date and time (datetime picker)
- Referred by (text)
- Attending doctor (select — from doctor accounts)
- Underlying medical conditions (textarea)
- Regular medications (textarea)
- Allergy history (text, default: "NKDA")
- Last meal (text)
- LMP (text, for applicable patients)

### Tab 2: Presenting Complaint

- Chief complaints (textarea)
- History of presenting illness (textarea)

### Tab 3: ABCDE Assessment (On Arrival)

Structured fields matching the current ER Observation Chart:

**A — Airway:**
- Speech / Added sounds (text)
- SpO2 % (number)
- SpO2 per liter (text, e.g., "RA", "2L NP")

**B — Breathing:**
- RR /min (number)
- Chest findings (text)

**C — Circulation:**
- PR /min (number)
- BP mmHg (text, e.g., "120/80")
- Heart sounds (text, e.g., "S1S2M0")
- GRBS mg/dL (number)

**D — Disability:**
- GCS: E (number 1-4), V (number 1-5), M (number 1-6), Total (auto-calculated)
- Pupil diameter: Right (text), Left (text)
- Reaction to light: Right (text), Left (text)
- Corneal reflex: Right (text), Left (text)

**E — Exposure:**
- Upper limbs: Right (text), Left (text)
- Lower limbs: Right (text), Left (text)
- Temperature °C (number)
- Abdomen / Log roll (text)
- DRE (text)
- Bedside USG (text)

### Tab 4: Physical Examination

- General condition (text, e.g., "fair", "in pain")
- O/E findings (textarea — free-text for detailed examination)

### Tab 5: Investigations Ordered

Checkboxes matching the current form:

**Blood:** CBC, LFT, RFT, Electrolytes, Cardiac Markers, CRP, Dengue, RBS, S.BHCG/UPT, Others (text)

**Urine:** Routine, Culture

**Radiology:** ECG, X-ray, USG, Doppler, CT, MRI

**Others:** free text field

### Tab 6: Treatment & Course

- Working diagnosis (textarea)
- Initial treatment (textarea)
- Course of management in ER (textarea) — running notes, timestamped entries
- In-hospital referrals and outcomes (textarea)

### Tab 7: Disposition

- Disposition type (select: Discharged by ER / Admitted / Referred / Discharged by referred department)
- Discharge date and time (datetime picker)

**Discharge vitals (at discharge):**
- GC, HR, RR, BP, SpO2, Temperature (same field types as ABCDE)
- Chest, CVS, Abdomen, CNS (text fields)

**Discharge instructions:**
- Medications (textarea)
- Advice (textarea)
- Follow-up (text, e.g., "Follow up in surgery OPD in 3 days")
- Discharged by (select — doctor)
- Condition explained to: Name (text), Relation to patient (text)

**Discharge checklist** (each item: Yes / No / N/A):
- Medications
- Prescription
- Lab reports
- X-rays and CT scan CD / ECG
- CT/MRI/USG report
- Medical Certificates
- Patient's old documents

- Received by: Name (text), Signature note (text)
- Attending nurse (text)

### Auto-save Behavior

- Every field change is debounced (500ms) and sent to the API
- Visual indicator: small "Saved ✓" or "Saving..." in the top bar
- Navigating away from a patient (to dashboard or another patient) triggers an immediate save
- No explicit "Save" button needed

## Feature 3: Document Export (.docx)

### ER Observation Chart

Generates a .docx matching the current 2-page template:
- **Page 1:** Hospital letterhead (logos, Dhivehi text, "Dr. Abdul Samad Memorial Hospital", address, "Patient Record — Trauma & Emergency Medicine"), demographics table, presenting complaint, ABCDE assessment table, past history, medications, allergy, working diagnosis
- **Page 2:** Physical examination, body diagram placeholder, initial treatment, investigation checkboxes table, disposition, attending doctor

### Discharge Summary

Generates a .docx matching the current DC template:
- Hospital letterhead (same as above, but titled "ER DISCHARGE SUMMARY" under "DEPARTMENT OF EMERGENCY AND TRAUMA")
- Demographics, underlying conditions, medications, allergies
- Chief complaints, HPI
- Examination: "On arrival to ER" vitals (from ABCDE tab) and "At discharge from ER" vitals (from Disposition tab)
- Investigations: "All Enclosed"
- Diagnosis
- Course of management
- In-hospital referrals
- Discharge instructions: medications, advice, follow-up
- Attending doctor, discharged by
- Condition explained to
- Discharge checklist table

### Letterhead

Both documents use the same letterhead from the current templates:
- Hospital logo (left) + government logo (right)
- Dhivehi script hospital name
- "Dr. Abdul Samad Memorial Hospital"
- "G.DH.THINADHOO, MALDIVES. TEL:684 1977 FAX: 684 1973"
- Form number (F027 for observation chart)
- The logo images will be extracted from the existing .docx templates and embedded in the generated documents

### Export Flow

- "Export Observation Chart" button on patient record → generates and downloads .docx
- "Discharge Patient" button → navigates to Disposition tab if not filled, then generates Discharge Summary .docx on completion
- Both buttons available in the patient banner at all times

## Feature 4: Patient Log

- Table view of all patients (current and discharged)
- Columns: name, age/gender, bed, chief complaint, arrival time, disposition, attending doctor
- Search by patient name or NID
- Filter by: date range, attending doctor, disposition type
- Click a row → open patient record
- Sorted by arrival time (newest first)

## Data Model

### Doctor
- id, name, username, passwordHash, role (DOCTOR/ADMIN), active, createdAt

### Patient
- id, name, age, gender, nidPassport, hospitalNumber
- bedId (references Bed), arrivalDateTime, referredBy, attendingDoctorId (references Doctor)
- underlyingConditions, regularMedications, allergyHistory, lastMeal, lmp
- chiefComplaints, historyOfPresentingIllness
- All ABCDE fields (airwaySpeech, spo2Percent, spo2PerLiter, rr, chestFindings, pr, bp, heartSounds, grbs, gcsE, gcsV, gcsM, pupilDiameterR, pupilDiameterL, pupilReactionR, pupilReactionL, cornealReflexR, cornealReflexL, ulRight, ulLeft, llRight, llLeft, tempC, abdomenLogRoll, dre, bedsideUsg)
- physicalExamGC, physicalExamFindings
- Investigations (boolean fields for each checkbox + othersText)
- workingDiagnosis, initialTreatment, courseOfManagement, referralsOutcomes
- dispositionType, dischargeDatetime
- Discharge vitals fields (dcGC, dcHR, dcRR, dcBP, dcSpo2, dcTemp, dcChest, dcCVS, dcAbdomen, dcCNS)
- dcMedications, dcAdvice, dcFollowUp, dcDoctorId, dcExplainedToName, dcExplainedToRelation
- Checklist fields (7 enum fields: YES/NO/NA)
- dcReceivedByName, dcAttendingNurse
- status (ACTIVE/DISCHARGED/ADMITTED/REFERRED)
- createdAt, updatedAt

### Bed
- id, name, zone (RESUS/RECEIVING/TRAUMA/GENERAL/TRIAGE), room (nullable), displayOrder, color

Beds are seeded at startup with the fixed 9 positions.

## Pages / Routes

- `/login` — login page
- `/` — dashboard (bed board), redirects to login if not authenticated
- `/patients/new` — new patient form
- `/patients/[id]` — patient record (tabbed)
- `/patients` — patient log (table view)
- `/admin/doctors` — manage doctor accounts (admin only)
- `/api/auth/[...nextauth]` — NextAuth endpoints
- `/api/patients` — CRUD endpoints
- `/api/patients/[id]/export/observation` — generate observation chart .docx
- `/api/patients/[id]/export/discharge` — generate discharge summary .docx
- `/api/beds` — bed status
- `/api/doctors` — doctor list

## Non-Goals

- No integration with hospital information systems
- No patient-facing features
- No medication database or drug interaction checks
- No image upload (body diagrams are not digitized — physical exam is free-text)
- No real-time collaboration (polling is sufficient)
- No mobile-specific layout (desktop browser is the primary use case)
