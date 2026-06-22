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
  AlignmentType,
  IShadingAttributesProperties,
} from "docx";
import {
  createLetterheadHeader,
  formatDateTime,
  textRun,
  labelValue,
  sectionHeading,
  documentTitle,
} from "./letterhead";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = any;

const CONTENT_WIDTH = 9026;
const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const THICK_BORDER = { style: BorderStyle.SINGLE, size: 2, color: "1B4965" };

function v(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

function demoCell(label: string, value: string, width: number): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    children: [
      new Paragraph({ children: [textRun(`${label}: `, { bold: true }), textRun(value || "—")] }),
    ],
  });
}

function vitalRow(label: string, value: string, unit: string, width1: number, width2: number, shading?: IShadingAttributesProperties): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: width1, type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading,
        children: [new Paragraph({ children: [textRun(label, { bold: true })] })],
      }),
      new TableCell({
        width: { size: width2, type: WidthType.DXA },
        margins: CELL_MARGINS,
        borders: BORDERS,
        shading,
        children: [new Paragraph({ children: [textRun(value ? `${value} ${unit}` : "—")] })],
      }),
    ],
  });
}

function abcdeSectionHeader(letter: string, title: string, color: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
        borders: { top: THICK_BORDER, bottom: BORDER, left: THICK_BORDER, right: THICK_BORDER },
        columnSpan: 2,
        shading: { type: ShadingType.CLEAR, fill: color, color: "auto" },
        children: [new Paragraph({ children: [
          new TextRun({ text: `${letter} — ${title}`, bold: true, font: "Arial", size: 20, color: "FFFFFF" }),
        ] })],
      }),
    ],
  });
}

function getInvestigationsByCategory(p: Patient) {
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
  if (p.invUrineRoutine) urine.push("Routine");
  if (p.invUrineCulture) urine.push("Culture");
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
  const gcsTotal = (p.gcsE ?? 0) + (p.gcsV ?? 0) + (p.gcsM ?? 0) || "";
  const colW4 = [2256, 2257, 2256, 2257];
  const labelW = 2800;
  const valueW = CONTENT_WIDTH - labelW;
  const altShading = { type: ShadingType.CLEAR, fill: "F8F9FA", color: "auto" } as IShadingAttributesProperties;

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
          demoCell("Doctor", v(p.attendingDoctor?.name), colW4[3]),
        ],
      }),
    ],
  });

  // ABCDE as a single table with colored section headers
  const abcdeTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelW, valueW],
    rows: [
      // A - Airway
      abcdeSectionHeader("A", "Airway", "DC2626"),
      vitalRow("Speech / Added Sounds", v(p.airwaySpeech), "", labelW, valueW),
      vitalRow("SpO₂", v(p.spo2Percent), `% on ${v(p.spo2PerLiter) || "RA"}`, labelW, valueW, altShading),

      // B - Breathing
      abcdeSectionHeader("B", "Breathing", "F97316"),
      vitalRow("Respiratory Rate", v(p.rr), "/min", labelW, valueW),
      vitalRow("Chest", v(p.chestFindings), "", labelW, valueW, altShading),

      // C - Circulation
      abcdeSectionHeader("C", "Circulation", "EAB308"),
      vitalRow("Heart Rate / PR", v(p.pr), "bpm", labelW, valueW),
      vitalRow("Blood Pressure", v(p.bp), "mmHg", labelW, valueW, altShading),
      vitalRow("Heart Sounds", v(p.heartSounds), "", labelW, valueW),
      vitalRow("GRBS", v(p.grbs), "mg/dL", labelW, valueW, altShading),

      // D - Disability
      abcdeSectionHeader("D", "Disability", "3B82F6"),
      vitalRow("GCS", `E${v(p.gcsE)} V${v(p.gcsV)} M${v(p.gcsM)} = ${gcsTotal}`, "", labelW, valueW),
      vitalRow("Pupils", `R: ${v(p.pupilDiameterR)} (${v(p.pupilReactionR)})   L: ${v(p.pupilDiameterL)} (${v(p.pupilReactionL)})`, "", labelW, valueW, altShading),
      vitalRow("Corneal Reflex", `R: ${v(p.cornealReflexR)}   L: ${v(p.cornealReflexL)}`, "", labelW, valueW),

      // E - Exposure
      abcdeSectionHeader("E", "Exposure", "22C55E"),
      vitalRow("Temperature", v(p.tempC), "°C", labelW, valueW),
      vitalRow("Abdomen / Log Roll", v(p.abdomenLogRoll), "", labelW, valueW, altShading),
      vitalRow("Upper Limbs", `R: ${v(p.ulRight)}   L: ${v(p.ulLeft)}`, "", labelW, valueW),
      vitalRow("Lower Limbs", `R: ${v(p.llRight)}   L: ${v(p.llLeft)}`, "", labelW, valueW, altShading),
      vitalRow("DRE", v(p.dre), "", labelW, valueW),
      vitalRow("Bedside USG", v(p.bedsideUsg), "", labelW, valueW, altShading),
    ],
  });

  // Investigations table
  const inv = getInvestigationsByCategory(p);
  const maxLen = Math.max(inv.blood.length, inv.urine.length, inv.radiology.length, 1);
  const invColW = [3009, 3009, 3008];

  const invRows: TableRow[] = [
    new TableRow({
      children: invColW.map((w, i) =>
        new TableCell({
          width: { size: w, type: WidthType.DXA },
          margins: CELL_MARGINS,
          borders: BORDERS,
          shading: { type: ShadingType.CLEAR, fill: "1B4965", color: "auto" },
          children: [new Paragraph({ children: [new TextRun({ text: ["Blood", "Urine", "Radiology"][i], bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })],
        })
      ),
    }),
  ];
  for (let i = 0; i < maxLen; i++) {
    const sh = i % 2 === 1 ? altShading : undefined;
    invRows.push(new TableRow({
      children: [
        new TableCell({ width: { size: invColW[0], type: WidthType.DXA }, margins: CELL_MARGINS, borders: BORDERS, shading: sh, children: [new Paragraph({ children: [textRun(inv.blood[i] ? `✓  ${inv.blood[i]}` : "")] })] }),
        new TableCell({ width: { size: invColW[1], type: WidthType.DXA }, margins: CELL_MARGINS, borders: BORDERS, shading: sh, children: [new Paragraph({ children: [textRun(inv.urine[i] ? `✓  ${inv.urine[i]}` : "")] })] }),
        new TableCell({ width: { size: invColW[2], type: WidthType.DXA }, margins: CELL_MARGINS, borders: BORDERS, shading: sh, children: [new Paragraph({ children: [textRun(inv.radiology[i] ? `✓  ${inv.radiology[i]}` : "")] })] }),
      ],
    }));
  }

  const investigationsTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: invColW,
    rows: invRows,
  });

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
          // Title
          documentTitle("ER OBSERVATION CHART"),

          // Demographics
          demographicsTable,
          new Paragraph({ spacing: { after: 40 }, children: [] }),

          // Medical History
          sectionHeading("Medical History"),
          labelValue("Underlying Conditions", p.underlyingConditions),
          labelValue("Regular Medications", p.regularMedications),
          labelValue("Allergy", p.allergyHistory),
          labelValue("Last Meal", p.lastMeal),
          labelValue("LMP", p.lmp),

          // Presenting Complaint
          sectionHeading("Presenting Complaint"),
          labelValue("Chief Complaints", p.chiefComplaints),
          labelValue("History of Presenting Illness", p.historyOfPresentingIllness),

          // Primary Survey
          sectionHeading("Primary Survey (ABCDE)"),
          abcdeTable,

          // Page break
          new Paragraph({ children: [new PageBreak()] }),

          // Physical Examination
          documentTitle("ER OBSERVATION CHART"),
          sectionHeading("Physical Examination"),
          labelValue("General Condition", p.physicalExamGC),
          labelValue("O/E Findings", p.physicalExamFindings),

          // Diagnosis & Treatment
          sectionHeading("Diagnosis & Treatment"),
          labelValue("Working Diagnosis", p.workingDiagnosis),
          labelValue("Initial Treatment", p.initialTreatment),
          labelValue("Course of Management", p.courseOfManagement),
          labelValue("Referrals & Outcomes", p.referralsOutcomes),

          // Investigations
          sectionHeading("Investigations Ordered"),
          investigationsTable,

          // Disposition
          sectionHeading("Disposition"),
          labelValue("Disposition", p.dispositionType),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          labelValue("Attending Doctor", p.attendingDoctor?.name),
          new Paragraph({ spacing: { before: 200 }, children: [textRun("Signature: ____________________________")] }),
        ],
      },
    ],
  });
}
