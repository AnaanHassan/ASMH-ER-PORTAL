import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  TextRun,
  PageBreak,
  IShadingAttributesProperties,
} from "docx";
import {
  createLetterheadHeader,
  formatDateTime,
  textRun,
  labelValue,
  sectionHeading,
} from "./letterhead";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = any;

const CONTENT_WIDTH = 9026;
const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function v(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

function demoCell(
  label: string,
  value: string,
  width: number
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    children: [
      new Paragraph({
        children: [
          textRun(`${label}: `, { bold: true }),
          textRun(value),
        ],
      }),
    ],
  });
}

function demoCellSpan(
  label: string,
  value: string,
  width: number,
  span: number
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    columnSpan: span,
    children: [
      new Paragraph({
        children: [
          textRun(`${label}: `, { bold: true }),
          textRun(value),
        ],
      }),
    ],
  });
}

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    shading: { type: ShadingType.CLEAR, fill: "1B4965", color: "auto" },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: true, font: "Arial", size: 20, color: "FFFFFF" }),
        ],
      }),
    ],
  });
}

function plainCell(text: string, width: number, shading?: IShadingAttributesProperties): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    shading: shading as IShadingAttributesProperties,
    children: [new Paragraph({ children: [textRun(text)] })],
  });
}

function examRow(
  label: string,
  arrival: string,
  discharge: string,
  index: number
): TableRow {
  const colW = [2400, 3313, 3313];
  const shading =
    index % 2 === 1
      ? { type: ShadingType.CLEAR, fill: "F8F9FA", color: "auto" }
      : undefined;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: colW[0], type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: shading as IShadingAttributesProperties,
        children: [new Paragraph({ children: [textRun(label, { bold: true })] })],
      }),
      plainCell(arrival, colW[1], shading),
      plainCell(discharge, colW[2], shading),
    ],
  });
}

function checklistRow(
  item: string,
  value: string | null | undefined,
  index: number
): TableRow {
  const colW = [4526, 1500, 1500, 1500];
  const checked = value !== null && value !== undefined && value !== "";
  const shading =
    index % 2 === 1
      ? { type: ShadingType.CLEAR, fill: "F8F9FA", color: "auto" }
      : undefined;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: colW[0], type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: shading as IShadingAttributesProperties,
        children: [new Paragraph({ children: [textRun(item)] })],
      }),
      plainCell(checked ? "✓" : "", colW[1], shading),
      plainCell(checked ? "" : "✓", colW[2], shading),
      plainCell("", colW[3], shading),
    ],
  });
}

export function buildDischargeSummary(p: Patient): Document {
  const colW4 = [2256, 2257, 2256, 2257];

  // --- Demographics ---
  const demographicsTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colW4,
    rows: [
      new TableRow({
        children: [
          demoCell("Patient Name", v(p.name), colW4[0]),
          demoCell("Age / Gender", `${v(p.age)} / ${v(p.gender)}`, colW4[1]),
          demoCell("NID/Passport", v(p.nidPassport), colW4[2]),
          demoCell("Hospital No", v(p.hospitalNumber), colW4[3]),
        ],
      }),
      new TableRow({
        children: [
          demoCell("ER Bed", v(p.bed?.name), colW4[0]),
          demoCell("Arrival", formatDateTime(p.arrivalDateTime) || "—", colW4[1]),
          demoCell("Referred By", v(p.referredBy), colW4[2]),
          demoCell("Attending Doctor", v(p.attendingDoctor?.name), colW4[3]),
        ],
      }),
      new TableRow({
        children: [
          demoCellSpan("Discharge Date & Time", formatDateTime(p.dischargeDatetime) || "—", colW4[0] + colW4[1], 2),
          demoCellSpan("", "", colW4[2] + colW4[3], 2),
        ],
      }),
    ],
  });

  // --- Exam comparison ---
  const examColW = [2400, 3313, 3313];
  const examTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: examColW,
    rows: [
      new TableRow({
        children: [
          headerCell("Parameter", examColW[0]),
          headerCell("On Arrival", examColW[1]),
          headerCell("At Discharge", examColW[2]),
        ],
      }),
      examRow("GC", v(p.physicalExamGC), v(p.dcGC), 0),
      examRow("HR", v(p.pr), v(p.dcHR), 1),
      examRow("RR", v(p.rr), v(p.dcRR), 2),
      examRow("BP", v(p.bp), v(p.dcBP), 3),
      examRow("SpO₂", `${v(p.spo2Percent)}%`, v(p.dcSpo2), 4),
      examRow("Temperature", p.tempC ? `${p.tempC}°C` : "—", p.dcTemp ? `${p.dcTemp}°C` : "—", 5),
      examRow("Chest", v(p.chestFindings), v(p.dcChest), 6),
      examRow("CVS", v(p.heartSounds), v(p.dcCVS), 7),
      examRow("Abdomen", v(p.abdomenLogRoll), v(p.dcAbdomen), 8),
      examRow("CNS", `GCS: E${v(p.gcsE)}V${v(p.gcsV)}M${v(p.gcsM)}`, v(p.dcCNS), 9),
    ],
  });

  // --- Checklist ---
  const clColW = [4526, 1500, 1500, 1500];
  const checklistTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: clColW,
    rows: [
      new TableRow({
        children: [
          headerCell("Item", clColW[0]),
          headerCell("Yes", clColW[1]),
          headerCell("No", clColW[2]),
          headerCell("N/A", clColW[3]),
        ],
      }),
      checklistRow("Medications", p.clMedications, 0),
      checklistRow("Prescription", p.clPrescription, 1),
      checklistRow("Lab Reports", p.clLabReports, 2),
      checklistRow("X-Ray / ECG", p.clXrayEcg, 3),
      checklistRow("CT / MRI / USG", p.clCtMriUsg, 4),
      checklistRow("Medical Certificates", p.clMedCerts, 5),
      checklistRow("Old Documents", p.clOldDocs, 6),
    ],
  });

  // --- Build document ---
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 2546, bottom: 1547, left: 1440, right: 1440 },
          },
        },
        headers: { default: createLetterheadHeader() },
        children: [
          // Demographics
          demographicsTable,
          new Paragraph({ spacing: { after: 60 }, children: [] }),

          // Medical History
          sectionHeading("Medical History"),
          labelValue("Underlying Conditions", p.underlyingConditions),
          labelValue("Regular Medications", p.regularMedications),
          labelValue("Allergy", p.allergyHistory),

          // Presenting Complaint
          sectionHeading("Presenting Complaint"),
          labelValue("Chief Complaints", p.chiefComplaints),
          labelValue("History of Presenting Illness", p.historyOfPresentingIllness),

          // Examination
          sectionHeading("Examination"),
          examTable,

          // Investigations
          sectionHeading("Investigations"),
          new Paragraph({
            spacing: { after: 60 },
            children: [textRun("All Enclosed")],
          }),

          // Diagnosis
          sectionHeading("Diagnosis"),
          labelValue("Working Diagnosis", p.workingDiagnosis),

          // Course of Management
          sectionHeading("Course of Management"),
          labelValue("Course", p.courseOfManagement),
          new Paragraph({
            spacing: { before: 80, after: 80 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "The patient is being discharged from emergency room in a hemodynamically stable state with the following advice.",
                bold: true,
                italics: true,
                font: "Arial",
                size: 20,
              }),
            ],
          }),

          // Page break
          new Paragraph({ children: [new PageBreak()] }),

          // Discharge Instructions
          sectionHeading("Discharge Instructions"),
          labelValue("Medications", p.dcMedications),
          labelValue("Advice", p.dcAdvice),
          labelValue("Follow-Up", p.dcFollowUp),

          // Discharge Details
          sectionHeading("Discharge Details"),
          labelValue("Attending Doctor", p.attendingDoctor?.name),
          labelValue("Discharged By", p.dcDoctor?.name),
          labelValue(
            "Condition Explained To",
            p.dcExplainedToName
              ? `${p.dcExplainedToName} (${p.dcExplainedToRelation ?? ""})`
              : null
          ),

          // Discharge Checklist
          sectionHeading("Discharge Checklist"),
          checklistTable,
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Received by / Nurse
          labelValue("Received By", p.dcReceivedByName),
          labelValue("Attending Nurse", p.dcAttendingNurse),
        ],
      },
    ],
  });
}
