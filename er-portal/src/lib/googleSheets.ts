import { google } from "googleapis";

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  return process.env.GOOGLE_SHEET_ID || "";
}

export async function logPatientToSheet(patient: {
  id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  nidPassport?: string | null;
  hospitalNumber?: string | null;
  bedName?: string | null;
  arrivalDateTime?: Date | string | null;
  chiefComplaints?: string | null;
  attendingDoctorName?: string | null;
}) {
  const sheetId = getSheetId();
  if (!sheetId) return;

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const arrival = patient.arrivalDateTime
      ? new Date(patient.arrivalDateTime).toLocaleString("en-GB", { timeZone: "Indian/Maldives" })
      : "";

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Patient Log!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          patient.id,
          patient.name,
          patient.age || "",
          patient.gender || "",
          patient.nidPassport || "",
          patient.hospitalNumber || "",
          patient.bedName || "",
          arrival,
          patient.chiefComplaints || "",
          patient.attendingDoctorName || "",
          "ACTIVE",
        ]],
      },
    });
  } catch (e) {
    console.error("Google Sheets log error:", e);
  }
}

export async function updatePatientInSheet(patient: {
  id: string;
  dispositionType?: string | null;
  workingDiagnosis?: string | null;
  dischargeDatetime?: Date | string | null;
  dcDoctorName?: string | null;
  status?: string | null;
}) {
  const sheetId = getSheetId();
  if (!sheetId) return;

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // Find the row with this patient ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Patient Log!A:A",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === patient.id) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }

    if (rowIndex === -1) return;

    const disposition = patient.dispositionType || "";
    const diagnosis = patient.workingDiagnosis || "";
    const dcTime = patient.dischargeDatetime
      ? new Date(patient.dischargeDatetime).toLocaleString("en-GB", { timeZone: "Indian/Maldives" })
      : "";
    const dcDoctor = patient.dcDoctorName || "";
    const status = patient.status || "";

    // Update columns K through O (status, disposition, diagnosis, discharge time, discharge doctor)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Patient Log!K${rowIndex}:O${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status, disposition, diagnosis, dcTime, dcDoctor]],
      },
    });
  } catch (e) {
    console.error("Google Sheets update error:", e);
  }
}

export async function deletePatientFromSheet(patientId: string) {
  const sheetId = getSheetId();
  if (!sheetId) return;

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Patient Log!A:A",
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === patientId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) return;

    // Get the sheet's internal ID
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Patient Log");
    const sheetInternalId = sheet?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetInternalId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });
  } catch (e) {
    console.error("Google Sheets delete error:", e);
  }
}

export async function initializeSheet(spreadsheetId: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Set headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Patient Log!A1:O1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "Patient ID", "Name", "Age", "Gender", "NID/Passport", "Hospital No",
        "Bed", "Arrival", "Chief Complaint", "Attending Doctor",
        "Status", "Disposition", "Diagnosis", "Discharge Time", "Discharged By",
      ]],
    },
  });

  // Bold headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.106, green: 0.286, blue: 0.396 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, title: "Patient Log" },
            fields: "title",
          },
        },
      ],
    },
  });
}
