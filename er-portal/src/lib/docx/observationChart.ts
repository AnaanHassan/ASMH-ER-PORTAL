import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  SectionType,
} from "docx";
import {
  createLetterheadHeader,
  formatDateTime,
  textRun,
  labelValue,
} from "./letterhead";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = any;

const CONTENT_WIDTH = 9026;
const CELL_MARGINS = { top: 40, bottom: 40, left: 80, right: 80 };
const BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};
const BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
};

function cell(
  text: string,
  width: number,
  bold = false
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: CELL_MARGINS,
    borders: BORDERS,
    children: [
      new Paragraph({ children: [textRun(text, { bold })] }),
    ],
  });
}

function getInvestigations(p: Patient): string {
  const inv: string[] = [];
  if (p.invCBC) inv.push("CBC");
  if (p.invLFT) inv.push("LFT");
  if (p.invRFT) inv.push("RFT");
  if (p.invElectrolytes) inv.push("Electrolytes");
  if (p.invCardiacMarkers) inv.push("Cardiac Markers");
  if (p.invCRP) inv.push("CRP");
  if (p.invDengue) inv.push("Dengue");
  if (p.invRBS) inv.push("RBS");
  if (p.invBHCG) inv.push("B-HCG");
  if (p.invUrineRoutine) inv.push("Urine Routine");
  if (p.invUrineCulture) inv.push("Urine Culture");
  if (p.invECG) inv.push("ECG");
  if (p.invXray) inv.push("X-Ray");
  if (p.invUSG) inv.push("USG");
  if (p.invDoppler) inv.push("Doppler");
  if (p.invCT) inv.push("CT");
  if (p.invMRI) inv.push("MRI");
  if (p.invOthers) inv.push(p.invOthers);
  return inv.join(", ") || "None";
}

export function buildObservationChart(p: Patient): Document {
  const gcsTotal =
    (p.gcsE ?? 0) + (p.gcsV ?? 0) + (p.gcsM ?? 0) || "";

  const colW4 = [2256, 2257, 2256, 2257];
  const colW6 = [1504, 1504, 1505, 1504, 1505, 1504];

  const demographicsTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colW4,
    rows: [
      new TableRow({
        children: [
          cell(`Name: ${p.name ?? ""}`, colW4[0], true),
          cell(`Age/Gender: ${p.age ?? ""}/${p.gender ?? ""}`, colW4[1]),
          cell(`NID: ${p.nidPassport ?? ""}`, colW4[2]),
          cell(`MRN: ${p.hospitalNumber ?? ""}`, colW4[3]),
        ],
      }),
      new TableRow({
        children: [
          cell(`Bed: ${p.bed?.name ?? ""}`, colW4[0]),
          cell(`Arrival: ${formatDateTime(p.arrivalDateTime)}`, colW4[1]),
          cell(`Referred By: ${p.referredBy ?? ""}`, colW4[2]),
          cell(`Doctor: ${p.attendingDoctor?.name ?? ""}`, colW4[3]),
        ],
      }),
    ],
  });

  const abcdeTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colW6,
    rows: [
      new TableRow({
        children: [
          cell("A - Airway", colW6[0], true),
          cell("B - Breathing", colW6[1], true),
          cell("C - Circulation", colW6[2], true),
          cell("D - Disability", colW6[3], true),
          cell("E - Exposure", colW6[4], true),
          cell("Vitals", colW6[5], true),
        ],
      }),
      new TableRow({
        children: [
          cell(`Speech: ${p.airwaySpeech ?? ""}`, colW6[0]),
          cell(
            `SpO2: ${p.spo2Percent ?? ""}% @ ${p.spo2PerLiter ?? ""}\nRR: ${p.rr ?? ""}\nChest: ${p.chestFindings ?? ""}`,
            colW6[1]
          ),
          cell(
            `PR: ${p.pr ?? ""}\nBP: ${p.bp ?? ""}\nHeart: ${p.heartSounds ?? ""}\nGRBS: ${p.grbs ?? ""}`,
            colW6[2]
          ),
          cell(
            `GCS: E${p.gcsE ?? ""}V${p.gcsV ?? ""}M${p.gcsM ?? ""} = ${gcsTotal}\nPupil R: ${p.pupilDiameterR ?? ""} ${p.pupilReactionR ?? ""}\nPupil L: ${p.pupilDiameterL ?? ""} ${p.pupilReactionL ?? ""}\nCorneal R: ${p.cornealReflexR ?? ""} L: ${p.cornealReflexL ?? ""}\nUL: R${p.ulRight ?? ""} L${p.ulLeft ?? ""}\nLL: R${p.llRight ?? ""} L${p.llLeft ?? ""}`,
            colW6[3]
          ),
          cell(
            `Temp: ${p.tempC ?? ""}°C\nAbdomen: ${p.abdomenLogRoll ?? ""}\nDRE: ${p.dre ?? ""}\nBedside USG: ${p.bedsideUsg ?? ""}`,
            colW6[4]
          ),
          cell(
            `HR: ${p.pr ?? ""}\nBP: ${p.bp ?? ""}\nRR: ${p.rr ?? ""}\nSpO2: ${p.spo2Percent ?? ""}%\nTemp: ${p.tempC ?? ""}°C`,
            colW6[5]
          ),
        ],
      }),
    ],
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
          // Demographics
          demographicsTable,
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // History
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("HISTORY", { bold: true, size: 22 }),
            ],
          }),
          labelValue("Underlying Conditions", p.underlyingConditions),
          labelValue("Regular Medications", p.regularMedications),
          labelValue("Allergy History", p.allergyHistory),
          labelValue("Last Meal", p.lastMeal),
          labelValue("LMP", p.lmp),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Chief Complaints & HPI
          labelValue("Chief Complaints", p.chiefComplaints),
          labelValue(
            "History of Presenting Illness",
            p.historyOfPresentingIllness
          ),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // ABCDE Assessment
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("ABCDE ASSESSMENT", { bold: true, size: 22 }),
            ],
          }),
          abcdeTable,

          // Page break
          new Paragraph({ children: [new PageBreak()] }),

          // Physical Exam
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("PHYSICAL EXAMINATION", {
                bold: true,
                size: 22,
              }),
            ],
          }),
          labelValue("General Condition", p.physicalExamGC),
          labelValue("Findings", p.physicalExamFindings),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Working Diagnosis
          labelValue("Working Diagnosis", p.workingDiagnosis),
          labelValue("Initial Treatment", p.initialTreatment),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Investigations
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("INVESTIGATIONS", { bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [textRun(getInvestigations(p))],
          }),

          // Disposition
          labelValue("Disposition", p.dispositionType),
          labelValue(
            "Attending Doctor",
            p.attendingDoctor?.name
          ),
        ],
      },
    ],
  });
}
