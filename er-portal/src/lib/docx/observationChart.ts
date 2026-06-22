import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  ShadingType,
  TextRun,
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
  width: number,
  isHeader = false
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

function kvRow(
  label: string,
  value: string,
  index: number,
  boldPrefix?: string
): TableRow {
  const labelW = 3000;
  const valueW = 6026;
  const shading =
    index % 2 === 1
      ? { type: ShadingType.CLEAR, fill: "F5F5F5", color: "auto" }
      : undefined;
  const labelChildren: TextRun[] = [];
  if (boldPrefix) {
    labelChildren.push(new TextRun({ text: boldPrefix, bold: true, font: "Arial", size: 20 }));
    labelChildren.push(textRun(label.slice(boldPrefix.length)));
  } else {
    labelChildren.push(textRun(label, { bold: true }));
  }
  return new TableRow({
    children: [
      new TableCell({
        width: { size: labelW, type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: shading as IShadingAttributesProperties,
        children: [new Paragraph({ children: labelChildren })],
      }),
      new TableCell({
        width: { size: valueW, type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: shading as IShadingAttributesProperties,
        children: [new Paragraph({ children: [textRun(value)] })],
      }),
    ],
  });
}

function getInvestigationsByCategory(p: Patient): {
  blood: string[];
  urine: string[];
  radiology: string[];
} {
  const blood: string[] = [];
  const urine: string[] = [];
  const radiology: string[] = [];

  if (p.invCBC) blood.push("CBC");
  if (p.invLFT) blood.push("LFT");
  if (p.invRFT) blood.push("RFT");
  if (p.invElectrolytes) blood.push("Electrolytes");
  if (p.invCardiacMarkers) blood.push("Cardiac Markers");
  if (p.invCRP) blood.push("CRP");
  if (p.invDengue) blood.push("Dengue");
  if (p.invRBS) blood.push("RBS");
  if (p.invBHCG) blood.push("B-HCG");

  if (p.invUrineRoutine) urine.push("Urine Routine");
  if (p.invUrineCulture) urine.push("Urine Culture");

  if (p.invECG) radiology.push("ECG");
  if (p.invXray) radiology.push("X-Ray");
  if (p.invUSG) radiology.push("USG");
  if (p.invDoppler) radiology.push("Doppler");
  if (p.invCT) radiology.push("CT");
  if (p.invMRI) radiology.push("MRI");
  if (p.invOthers) radiology.push(p.invOthers);

  return { blood, urine, radiology };
}

export function buildObservationChart(p: Patient): Document {
  const gcsTotal = (p.gcsE ?? 0) + (p.gcsV ?? 0) + (p.gcsM ?? 0) || "—";

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
    ],
  });

  // --- ABCDE rows ---
  const abcdeRows = [
    kvRow("A — Speech / Added Sounds", v(p.airwaySpeech), 0, "A — "),
    kvRow("A — SpO₂", `${v(p.spo2Percent)}% on ${v(p.spo2PerLiter)}`, 1, "A — "),
    kvRow("B — Respiratory Rate", v(p.rr), 2, "B — "),
    kvRow("B — Chest", v(p.chestFindings), 3, "B — "),
    kvRow("C — HR / PR", v(p.pr), 4, "C — "),
    kvRow("C — BP", v(p.bp), 5, "C — "),
    kvRow("C — Heart Sounds", v(p.heartSounds), 6, "C — "),
    kvRow("C — GRBS", v(p.grbs), 7, "C — "),
    kvRow("D — GCS", `E${v(p.gcsE)} V${v(p.gcsV)} M${v(p.gcsM)} = ${gcsTotal}`, 8, "D — "),
    kvRow("D — Pupils", `R: ${v(p.pupilDiameterR)} (${v(p.pupilReactionR)})  L: ${v(p.pupilDiameterL)} (${v(p.pupilReactionL)})`, 9, "D — "),
    kvRow("D — Corneal Reflex", `R: ${v(p.cornealReflexR)}  L: ${v(p.cornealReflexL)}`, 10, "D — "),
    kvRow("E — Temperature", `${v(p.tempC)}°C`, 11, "E — "),
    kvRow("E — Abdomen", v(p.abdomenLogRoll), 12, "E — "),
    kvRow("E — UL", `R: ${v(p.ulRight)}  L: ${v(p.ulLeft)}`, 13, "E — "),
    kvRow("E — LL", `R: ${v(p.llRight)}  L: ${v(p.llLeft)}`, 14, "E — "),
    kvRow("E — DRE", v(p.dre), 15, "E — "),
    kvRow("E — Bedside USG", v(p.bedsideUsg), 16, "E — "),
  ];

  const abcdeTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3000, 6026],
    rows: abcdeRows,
  });

  // --- Investigations table ---
  const inv = getInvestigationsByCategory(p);
  const maxLen = Math.max(inv.blood.length, inv.urine.length, inv.radiology.length, 1);
  const invColW = [3009, 3009, 3008];

  const invHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: invColW[0], type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: { type: ShadingType.CLEAR, fill: "1B4965", color: "auto" },
        children: [new Paragraph({ children: [new TextRun({ text: "Blood Tests", bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })],
      }),
      new TableCell({
        width: { size: invColW[1], type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: { type: ShadingType.CLEAR, fill: "1B4965", color: "auto" },
        children: [new Paragraph({ children: [new TextRun({ text: "Urine", bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })],
      }),
      new TableCell({
        width: { size: invColW[2], type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading: { type: ShadingType.CLEAR, fill: "1B4965", color: "auto" },
        children: [new Paragraph({ children: [new TextRun({ text: "Radiology", bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })],
      }),
    ],
  });

  const invDataRows: TableRow[] = [];
  for (let i = 0; i < maxLen; i++) {
    const shading = i % 2 === 1 ? { type: ShadingType.CLEAR, fill: "F8F9FA", color: "auto" } : undefined;
    invDataRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: invColW[0], type: WidthType.DXA },
            margins: CELL_MARGINS,
            borders: BORDERS,
            shading: shading as IShadingAttributesProperties,
            children: [new Paragraph({ children: [textRun(inv.blood[i] ? `✓ ${inv.blood[i]}` : "")] })],
          }),
          new TableCell({
            width: { size: invColW[1], type: WidthType.DXA },
            margins: CELL_MARGINS,
            borders: BORDERS,
            shading: shading as IShadingAttributesProperties,
            children: [new Paragraph({ children: [textRun(inv.urine[i] ? `✓ ${inv.urine[i]}` : "")] })],
          }),
          new TableCell({
            width: { size: invColW[2], type: WidthType.DXA },
            margins: CELL_MARGINS,
            borders: BORDERS,
            shading: shading as IShadingAttributesProperties,
            children: [new Paragraph({ children: [textRun(inv.radiology[i] ? `✓ ${inv.radiology[i]}` : "")] })],
          }),
        ],
      })
    );
  }

  const investigationsTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: invColW,
    rows: [invHeaderRow, ...invDataRows],
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

          // Presenting Complaint
          sectionHeading("Presenting Complaint"),
          labelValue("Underlying Conditions", p.underlyingConditions),
          labelValue("Regular Medications", p.regularMedications),
          labelValue("Allergy", p.allergyHistory),
          new Paragraph({ spacing: { after: 40 }, children: [] }),
          labelValue("Chief Complaints", p.chiefComplaints),
          labelValue("History of Presenting Illness", p.historyOfPresentingIllness),

          // Primary Survey
          sectionHeading("Primary Survey (ABCDE)"),
          abcdeTable,

          // Page break
          new Paragraph({ children: [new PageBreak()] }),

          // Physical Examination
          sectionHeading("Physical Examination"),
          labelValue("General Condition", p.physicalExamGC),
          labelValue("Findings", p.physicalExamFindings),

          // Diagnosis & Treatment
          sectionHeading("Diagnosis & Treatment"),
          labelValue("Working Diagnosis", p.workingDiagnosis),
          labelValue("Initial Treatment", p.initialTreatment),

          // Investigations Ordered
          sectionHeading("Investigations Ordered"),
          investigationsTable,

          // Disposition
          sectionHeading("Disposition"),
          labelValue("Disposition", p.dispositionType),
          labelValue("Attending Doctor", p.attendingDoctor?.name),
          new Paragraph({ spacing: { before: 300 }, children: [] }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("Signature: ____________________________"),
            ],
          }),
        ],
      },
    ],
  });
}
