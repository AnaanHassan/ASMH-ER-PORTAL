import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Patient = any;

function v(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";
  return String(val);
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function getInvestigationsText(p: Patient): string {
  const inv: string[] = [];
  if (p.invCBC) inv.push("CBC");
  if (p.invLFT) inv.push("LFT");
  if (p.invRFT) inv.push("RFT");
  if (p.invElectrolytes) inv.push("Electrolytes");
  if (p.invCardiacMarkers) inv.push("Cardiac Markers");
  if (p.invCRP) inv.push("CRP");
  if (p.invDengue) inv.push("Dengue");
  if (p.invRBS) inv.push("RBS");
  if (p.invBHCG) inv.push("S.BHCG/UPT");
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

function replaceInXml(xml: string, replacements: [string, string][]): string {
  for (const [search, replace] of replacements) {
    // Handle text that may be split across multiple <w:t> runs
    // First try simple replacement
    xml = xml.split(search).join(replace);
  }
  return xml;
}

export async function buildObservationChartFromTemplate(p: Patient): Promise<Buffer> {
  const JSZip = require("jszip");
  const templatePath = path.join(process.cwd(), "public/templates/observation-chart.docx");
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  let docXml: string = await zip.file("word/document.xml").async("string");

  const gcsTotal = (p.gcsE ?? 0) + (p.gcsV ?? 0) + (p.gcsM ?? 0) || "";
  const doctorName = v(p.attendingDoctor?.name);
  const dcDoctorName = v(p.dcDoctor?.name) || doctorName;

  const replacements: [string, string][] = [
    // Demographics
    ["Patient Name:", `Patient Name: ${v(p.name)}`],
    ["Age &amp; Gender:", `Age &amp; Gender: ${v(p.age)} ${v(p.gender)}`],
    ["Age & Gender:", `Age & Gender: ${v(p.age)} ${v(p.gender)}`],
    ["NID Number:", `NID Number: ${v(p.nidPassport)}`],
    ["Hospital Number:", `Hospital Number: ${v(p.hospitalNumber)}`],
    ["ER Bed:", `ER Bed: ${v(p.bed?.name)}`],
    ["Arrival date and time:", `Arrival date and time: ${formatDateTime(p.arrivalDateTime)}`],

    // Medical History
    ["Patient is a known case of:", `Patient is a known case of: ${v(p.underlyingConditions)}`],
    ["Regular Medications:", `Regular Medications: ${v(p.regularMedications)}`],
    ["Allergy History:", `Allergy History: ${v(p.allergyHistory)}`],

    // Presenting Complaint
    ["Chief Complaints:", `Chief Complaints: ${v(p.chiefComplaints)}`],
    ["History of Presenting Illness:", `History of Presenting Illness: ${v(p.historyOfPresentingIllness)}`],

    // Examination
    ["O/E:", `O/E: ${v(p.physicalExamGC)}`],
    ["GCS:", `GCS: E${v(p.gcsE)}V${v(p.gcsV)}M${v(p.gcsM)} = ${gcsTotal}`],
    ["HR:  bpm", `HR: ${v(p.pr)} bpm`],
    ["RR:  breaths", `RR: ${v(p.rr)} breaths`],
    ["BP: mmHg", `BP: ${v(p.bp)} mmHg`],
    ["SpO2: % under RA", `SpO2: ${v(p.spo2Percent)}% under ${v(p.spo2PerLiter) || "RA"}`],
    ["Temperature:", `Temperature: ${v(p.tempC)}°C`],
    ["GRBS: mg/dL", `GRBS: ${v(p.grbs)} mg/dL`],
    ["Chest:", `Chest: ${v(p.chestFindings)}`],
    ["Abdomen:", `Abdomen: ${v(p.abdomenLogRoll)}`],

    // Investigations
    ["All Enclosed", `All Enclosed - ${getInvestigationsText(p)}`],

    // Diagnosis
    ["Diagnosis", `Diagnosis: ${v(p.workingDiagnosis)}`],

    // Initial treatment
    ["Initial treatment:", `Initial treatment: ${v(p.initialTreatment)}`],

    // Attending Doctor
    ["Dr.  (ER Medical Officer)", `Dr. ${doctorName} (ER Medical Officer)`],

    // Course of management
    ["Course of management in ER:", `Course of management in ER: ${v(p.courseOfManagement)}`],

    // Referrals
    ["In hospital referrals and outcomes:", `In hospital referrals and outcomes: ${v(p.referralsOutcomes)}`],

    // Discharge Instructions
    ["Medications:", `Medications: ${v(p.dcMedications)}`],
    ["Advice:", `Advice: ${v(p.dcAdvice)}`],
    ["Follow up in", `Follow up: ${v(p.dcFollowUp)}`],

    // Discharged by
    ["Discharged by:", `Discharged by: Dr. ${dcDoctorName}`],

    // Condition explained to
    ["Name:", `Name: ${v(p.dcExplainedToName)}`],
    ["Relation to patient:", `Relation to patient: ${v(p.dcExplainedToRelation)}`],

    // Attending Nurse
    ["Attending Nurse:", `Attending Nurse: ${v(p.dcAttendingNurse)}`],
  ];

  docXml = replaceInXml(docXml, replacements);

  zip.file("word/document.xml", docXml);

  const outputBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return outputBuffer;
}
