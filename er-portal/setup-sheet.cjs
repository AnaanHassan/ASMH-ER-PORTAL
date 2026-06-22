const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, "service-account.json"), "utf-8"));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

async function main() {
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  // Create spreadsheet
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: "ASMH ER - Patient Log" },
      sheets: [{ properties: { title: "Patient Log" } }],
    },
  });

  const spreadsheetId = res.data.spreadsheetId;
  console.log("Spreadsheet created:", spreadsheetId);
  console.log("URL: https://docs.google.com/spreadsheets/d/" + spreadsheetId);

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

  // Format headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.106, green: 0.286, blue: 0.396 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
      ],
    },
  });

  // Share with user
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: "writer",
      type: "user",
      emailAddress: "ananhassan57@gmail.com",
    },
  });

  console.log("Shared with ananhassan57@gmail.com");
  console.log("\nAdd this to your .env.local and Fly secrets:");
  console.log(`GOOGLE_SHEET_ID=${spreadsheetId}`);
}

main().catch(console.error);
