import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
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
const HALF = 4513;
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

function examRow(
  label: string,
  arrival: string,
  discharge: string
): TableRow {
  const third = 3600;
  return new TableRow({
    children: [
      cell(label, third, true),
      cell(arrival, third),
      cell(discharge, third),
    ],
  });
}

function checklistRow(
  item: string,
  value: string | null | undefined
): TableRow {
  const colW = [4800, 2000, 2000, 2000];
  const yes = value && value !== "" ? "Y" : "";
  const no = !value || value === "" ? "" : "";
  return new TableRow({
    children: [
      cell(item, colW[0]),
      cell(yes, colW[1]),
      cell(no, colW[2]),
      cell("", colW[3]),
    ],
  });
}

export function buildDischargeSummary(p: Patient): Document {
  const demographicsTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [HALF, HALF],
    rows: [
      new TableRow({
        children: [
          cell(`Name: ${p.name ?? ""}`, HALF, true),
          cell(`Bed: ${p.bed?.name ?? ""}`, HALF),
        ],
      }),
      new TableRow({
        children: [
          cell(
            `Age/Gender: ${p.age ?? ""}/${p.gender ?? ""}`,
            HALF
          ),
          cell(
            `Arrival: ${formatDateTime(p.arrivalDateTime)}`,
            HALF
          ),
        ],
      }),
      new TableRow({
        children: [
          cell(
            `NID: ${p.nidPassport ?? ""} / MRN: ${p.hospitalNumber ?? ""}`,
            HALF
          ),
          cell(
            `Discharge: ${formatDateTime(p.dischargeDatetime)}`,
            HALF
          ),
        ],
      }),
    ],
  });

  const thirdW = 3009;
  const examTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [thirdW, thirdW, thirdW],
    rows: [
      new TableRow({
        children: [
          cell("Parameter", thirdW, true),
          cell("On Arrival to ER", thirdW, true),
          cell("At Discharge from ER", thirdW, true),
        ],
      }),
      examRow("GC", p.physicalExamGC ?? "", p.dcGC ?? ""),
      examRow("HR", String(p.pr ?? ""), String(p.dcHR ?? "")),
      examRow("RR", String(p.rr ?? ""), String(p.dcRR ?? "")),
      examRow("BP", p.bp ?? "", p.dcBP ?? ""),
      examRow(
        "SpO2",
        `${p.spo2Percent ?? ""}%`,
        p.dcSpo2 ?? ""
      ),
      examRow(
        "Temp",
        `${p.tempC ?? ""}°C`,
        p.dcTemp ? `${p.dcTemp}°C` : ""
      ),
      examRow("Chest", p.chestFindings ?? "", p.dcChest ?? ""),
      examRow("CVS", p.heartSounds ?? "", p.dcCVS ?? ""),
      examRow("Abdomen", p.abdomenLogRoll ?? "", p.dcAbdomen ?? ""),
      examRow(
        "CNS",
        `GCS: E${p.gcsE ?? ""}V${p.gcsV ?? ""}M${p.gcsM ?? ""}`,
        p.dcCNS ?? ""
      ),
    ],
  });

  const clColW = [3826, 1733, 1733, 1734];
  const checklistTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: clColW,
    rows: [
      new TableRow({
        children: [
          cell("Item", clColW[0], true),
          cell("Yes", clColW[1], true),
          cell("No", clColW[2], true),
          cell("N/A", clColW[3], true),
        ],
      }),
      checklistRow("Medications", p.clMedications),
      checklistRow("Prescription", p.clPrescription),
      checklistRow("Lab Reports", p.clLabReports),
      checklistRow("X-Ray / ECG", p.clXrayEcg),
      checklistRow("CT / MRI / USG", p.clCtMriUsg),
      checklistRow("Medical Certificates", p.clMedCerts),
      checklistRow("Old Documents", p.clOldDocs),
    ],
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: 2546,
              bottom: 1547,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: createLetterheadHeader(),
        },
        children: [
          // Demographics
          demographicsTable,
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // History
          labelValue(
            "Underlying Conditions",
            p.underlyingConditions
          ),
          labelValue("Regular Medications", p.regularMedications),
          labelValue("Allergy History", p.allergyHistory),
          new Paragraph({ spacing: { after: 80 }, children: [] }),

          // Complaints
          labelValue("Chief Complaints", p.chiefComplaints),
          labelValue(
            "History of Presenting Illness",
            p.historyOfPresentingIllness
          ),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Examination comparison
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("EXAMINATION", { bold: true, size: 22 }),
            ],
          }),
          examTable,
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Investigations
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("Investigations: ", { bold: true }),
              textRun("All Enclosed"),
            ],
          }),
          new Paragraph({ spacing: { after: 80 }, children: [] }),

          // Diagnosis & management
          labelValue("Diagnosis", p.workingDiagnosis),
          labelValue(
            "Course of Management",
            p.courseOfManagement
          ),
          new Paragraph({ spacing: { after: 80 }, children: [] }),

          // Discharge statement
          new Paragraph({
            spacing: { after: 80 },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              textRun(
                "The patient is being discharged from emergency room in a hemodynamically stable state with the following advice.",
                { bold: true }
              ),
            ],
          }),

          // Referrals & instructions
          labelValue("Referrals", p.referralsOutcomes),
          labelValue("Medications", p.dcMedications),
          labelValue("Advice", p.dcAdvice),
          labelValue("Follow-Up", p.dcFollowUp),
          new Paragraph({ spacing: { after: 80 }, children: [] }),

          // Doctors
          labelValue(
            "Attending Doctor",
            p.attendingDoctor?.name
          ),
          labelValue("Discharged By", p.dcDoctor?.name),
          new Paragraph({ spacing: { after: 80 }, children: [] }),

          // Condition explained to
          labelValue(
            "Condition Explained To",
            p.dcExplainedToName
              ? `${p.dcExplainedToName} (${p.dcExplainedToRelation ?? ""})`
              : ""
          ),
          new Paragraph({ spacing: { after: 100 }, children: [] }),

          // Discharge checklist
          new Paragraph({
            spacing: { after: 60 },
            children: [
              textRun("DISCHARGE CHECKLIST", {
                bold: true,
                size: 22,
              }),
            ],
          }),
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
