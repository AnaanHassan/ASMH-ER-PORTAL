#!/bin/sh
echo "=== Starting AMSH ER Portal ==="

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  // Create tables via raw SQL using Prisma client
  const tables = await p.\$queryRawUnsafe(\"SELECT name FROM sqlite_master WHERE type='table' AND name='Bed'\");
  // Check if schema is correct by looking for proper createdAt format
  let needsRecreate = tables.length === 0;
  if (!needsRecreate) {
    try {
      const doc = await p.\$queryRawUnsafe(\"SELECT sql FROM sqlite_master WHERE name='Doctor'\");
      if (doc[0] && !doc[0].sql.includes('strftime')) needsRecreate = true;
    } catch(e) { needsRecreate = true; }
  }
  if (needsRecreate) {
    console.log('Creating/recreating database tables...');
    await p.\$executeRawUnsafe('DROP TABLE IF EXISTS Patient');
    await p.\$executeRawUnsafe('DROP TABLE IF EXISTS Bed');
    await p.\$executeRawUnsafe('DROP TABLE IF EXISTS Doctor');
    console.log('Creating database tables...');
    await p.\$executeRawUnsafe(\`CREATE TABLE IF NOT EXISTS Doctor (id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'DOCTOR', active INTEGER NOT NULL DEFAULT 1, createdAt DATETIME)\`);
    await p.\$executeRawUnsafe(\`CREATE TABLE IF NOT EXISTS Bed (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, zone TEXT NOT NULL, room TEXT, displayOrder INTEGER NOT NULL, color TEXT NOT NULL)\`);
    await p.\$executeRawUnsafe(\`CREATE TABLE IF NOT EXISTS Patient (id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER, gender TEXT, nidPassport TEXT, hospitalNumber TEXT, bedId TEXT REFERENCES Bed(id), arrivalDateTime TEXT, referredBy TEXT, attendingDoctorId TEXT REFERENCES Doctor(id), underlyingConditions TEXT, regularMedications TEXT, allergyHistory TEXT DEFAULT 'NKDA', lastMeal TEXT, lmp TEXT, chiefComplaints TEXT, historyOfPresentingIllness TEXT, airwaySpeech TEXT, spo2Percent REAL, spo2PerLiter TEXT, rr INTEGER, chestFindings TEXT, pr INTEGER, bp TEXT, heartSounds TEXT, grbs REAL, gcsE INTEGER, gcsV INTEGER, gcsM INTEGER, pupilDiameterR TEXT, pupilDiameterL TEXT, pupilReactionR TEXT, pupilReactionL TEXT, cornealReflexR TEXT, cornealReflexL TEXT, ulRight TEXT, ulLeft TEXT, llRight TEXT, llLeft TEXT, tempC REAL, abdomenLogRoll TEXT, dre TEXT, bedsideUsg TEXT, physicalExamGC TEXT, physicalExamFindings TEXT, invCBC INTEGER NOT NULL DEFAULT 0, invLFT INTEGER NOT NULL DEFAULT 0, invRFT INTEGER NOT NULL DEFAULT 0, invElectrolytes INTEGER NOT NULL DEFAULT 0, invCardiacMarkers INTEGER NOT NULL DEFAULT 0, invCRP INTEGER NOT NULL DEFAULT 0, invDengue INTEGER NOT NULL DEFAULT 0, invRBS INTEGER NOT NULL DEFAULT 0, invBHCG INTEGER NOT NULL DEFAULT 0, invUrineRoutine INTEGER NOT NULL DEFAULT 0, invUrineCulture INTEGER NOT NULL DEFAULT 0, invECG INTEGER NOT NULL DEFAULT 0, invXray INTEGER NOT NULL DEFAULT 0, invUSG INTEGER NOT NULL DEFAULT 0, invDoppler INTEGER NOT NULL DEFAULT 0, invCT INTEGER NOT NULL DEFAULT 0, invMRI INTEGER NOT NULL DEFAULT 0, invOthers TEXT, workingDiagnosis TEXT, initialTreatment TEXT, courseOfManagement TEXT, referralsOutcomes TEXT, dispositionType TEXT, dischargeDatetime TEXT, dcGC TEXT, dcHR INTEGER, dcRR INTEGER, dcBP TEXT, dcSpo2 TEXT, dcTemp REAL, dcChest TEXT, dcCVS TEXT, dcAbdomen TEXT, dcCNS TEXT, dcMedications TEXT, dcAdvice TEXT, dcFollowUp TEXT, dcDoctorId TEXT REFERENCES Doctor(id), dcExplainedToName TEXT, dcExplainedToRelation TEXT, clMedications TEXT, clPrescription TEXT, clLabReports TEXT, clXrayEcg TEXT, clCtMriUsg TEXT, clMedCerts TEXT, clOldDocs TEXT, dcReceivedByName TEXT, dcAttendingNurse TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', createdAt DATETIME, updatedAt DATETIME)\`);
    console.log('Tables created');
  }

  // Seed if empty
  const beds = await p.bed.count();
  if (beds > 0) { console.log('DB already seeded'); return; }

  console.log('Seeding database...');
  const bedData = [
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
  for (const b of bedData) { await p.bed.create({ data: b }); }
  const hash = await bcrypt.hash('admin123', 10);
  await p.doctor.create({ data: { name: 'Admin', username: 'admin', passwordHash: hash, role: 'ADMIN', createdAt: new Date() } });
  console.log('Seeded 9 beds and admin account');
})().catch(e => console.error('Startup error:', e)).finally(() => p.\$disconnect());
" 2>&1

echo "Starting Next.js server..."
exec node server.js
