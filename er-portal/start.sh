#!/bin/sh

# Run migrations
node node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma

# Seed if database is empty (check if beds exist)
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
(async () => {
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
  await p.doctor.create({ data: { name: 'Admin', username: 'admin', passwordHash: hash, role: 'ADMIN' } });
  console.log('Seeded 9 beds and admin account');
})().catch(e => console.error(e)).finally(() => p.\$disconnect());
"

# Start the server
node server.js
