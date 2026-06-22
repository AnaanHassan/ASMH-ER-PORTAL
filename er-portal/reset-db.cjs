const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  console.log('Dropping old tables...');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS "Patient"');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS "Bed"');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS "Doctor"');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS Patient');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS Bed');
  await p.$executeRawUnsafe('DROP TABLE IF EXISTS Doctor');

  console.log('Creating with correct Prisma schema...');

  await p.$executeRawUnsafe(`CREATE TABLE "Doctor" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "username" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'DOCTOR', "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await p.$executeRawUnsafe(`CREATE UNIQUE INDEX "Doctor_username_key" ON "Doctor"("username")`);

  await p.$executeRawUnsafe(`CREATE TABLE "Bed" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "zone" TEXT NOT NULL, "room" TEXT, "displayOrder" INTEGER NOT NULL, "color" TEXT NOT NULL)`);
  await p.$executeRawUnsafe(`CREATE UNIQUE INDEX "Bed_name_key" ON "Bed"("name")`);

  await p.$executeRawUnsafe(`CREATE TABLE "Patient" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "age" INTEGER, "gender" TEXT, "nidPassport" TEXT, "hospitalNumber" TEXT, "bedId" TEXT, "arrivalDateTime" DATETIME, "referredBy" TEXT, "attendingDoctorId" TEXT, "underlyingConditions" TEXT, "regularMedications" TEXT, "allergyHistory" TEXT DEFAULT 'NKDA', "lastMeal" TEXT, "lmp" TEXT, "chiefComplaints" TEXT, "historyOfPresentingIllness" TEXT, "airwaySpeech" TEXT, "spo2Percent" REAL, "spo2PerLiter" TEXT, "rr" INTEGER, "chestFindings" TEXT, "pr" INTEGER, "bp" TEXT, "heartSounds" TEXT, "grbs" REAL, "gcsE" INTEGER, "gcsV" INTEGER, "gcsM" INTEGER, "pupilDiameterR" TEXT, "pupilDiameterL" TEXT, "pupilReactionR" TEXT, "pupilReactionL" TEXT, "cornealReflexR" TEXT, "cornealReflexL" TEXT, "ulRight" TEXT, "ulLeft" TEXT, "llRight" TEXT, "llLeft" TEXT, "tempC" REAL, "abdomenLogRoll" TEXT, "dre" TEXT, "bedsideUsg" TEXT, "physicalExamGC" TEXT, "physicalExamFindings" TEXT, "invCBC" BOOLEAN NOT NULL DEFAULT false, "invLFT" BOOLEAN NOT NULL DEFAULT false, "invRFT" BOOLEAN NOT NULL DEFAULT false, "invElectrolytes" BOOLEAN NOT NULL DEFAULT false, "invCardiacMarkers" BOOLEAN NOT NULL DEFAULT false, "invCRP" BOOLEAN NOT NULL DEFAULT false, "invDengue" BOOLEAN NOT NULL DEFAULT false, "invRBS" BOOLEAN NOT NULL DEFAULT false, "invBHCG" BOOLEAN NOT NULL DEFAULT false, "invUrineRoutine" BOOLEAN NOT NULL DEFAULT false, "invUrineCulture" BOOLEAN NOT NULL DEFAULT false, "invECG" BOOLEAN NOT NULL DEFAULT false, "invXray" BOOLEAN NOT NULL DEFAULT false, "invUSG" BOOLEAN NOT NULL DEFAULT false, "invDoppler" BOOLEAN NOT NULL DEFAULT false, "invCT" BOOLEAN NOT NULL DEFAULT false, "invMRI" BOOLEAN NOT NULL DEFAULT false, "invOthers" TEXT, "workingDiagnosis" TEXT, "initialTreatment" TEXT, "courseOfManagement" TEXT, "referralsOutcomes" TEXT, "dispositionType" TEXT, "dischargeDatetime" DATETIME, "dcGC" TEXT, "dcHR" INTEGER, "dcRR" INTEGER, "dcBP" TEXT, "dcSpo2" TEXT, "dcTemp" REAL, "dcChest" TEXT, "dcCVS" TEXT, "dcAbdomen" TEXT, "dcCNS" TEXT, "dcMedications" TEXT, "dcAdvice" TEXT, "dcFollowUp" TEXT, "dcDoctorId" TEXT, "dcExplainedToName" TEXT, "dcExplainedToRelation" TEXT, "clMedications" TEXT, "clPrescription" TEXT, "clLabReports" TEXT, "clXrayEcg" TEXT, "clCtMriUsg" TEXT, "clMedCerts" TEXT, "clOldDocs" TEXT, "dcReceivedByName" TEXT, "dcAttendingNurse" TEXT, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Patient_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Patient_attendingDoctorId_fkey" FOREIGN KEY ("attendingDoctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT "Patient_dcDoctorId_fkey" FOREIGN KEY ("dcDoctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`);

  console.log('Tables created. Seeding...');

  const beds = [
    { name: 'RESUS', zone: 'RESUS', room: null, displayOrder: 1, color: '#DC2626' },
    { name: 'Bed 2 (Receiving)', zone: 'RECEIVING', room: null, displayOrder: 2, color: '#E8A0A0' },
    { name: 'TRAUMA (R3)', zone: 'TRAUMA', room: 'R3', displayOrder: 3, color: '#F5D0D0' },
    { name: 'Bed 3 (R3)', zone: 'GENERAL', room: 'R3', displayOrder: 4, color: '#FEF9E7' },
    { name: 'Bed 4 (R1)', zone: 'GENERAL', room: 'R1', displayOrder: 5, color: '#FEF9E7' },
    { name: 'Bed 5 (R1)', zone: 'GENERAL', room: 'R1', displayOrder: 6, color: '#FEF9E7' },
    { name: 'Bed 6 (R2)', zone: 'GENERAL', room: 'R2', displayOrder: 7, color: '#FEF9E7' },
    { name: 'Bed 7 (R2)', zone: 'GENERAL', room: 'R2', displayOrder: 8, color: '#FEF9E7' },
    { name: 'Triage Chair', zone: 'TRIAGE', room: null, displayOrder: 9, color: '#EAF2F8' },
  ];
  for (const b of beds) { await p.bed.create({ data: b }); }

  const hash = await bcrypt.hash('admin123', 10);
  await p.doctor.create({ data: { name: 'Admin', username: 'admin', passwordHash: hash, role: 'ADMIN' } });

  // Test patient creation
  const test = await p.patient.create({ data: { name: 'Test Patient', arrivalDateTime: new Date() } });
  console.log('Test patient created:', test.id, 'arrivalDateTime:', test.arrivalDateTime);
  await p.patient.delete({ where: { id: test.id } });
  console.log('Test passed — patient create/delete works!');

  await p.$disconnect();
})().catch(e => console.error('ERROR:', e));
