import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const beds = [
    { name: "RESUS", zone: "RESUS", room: null, displayOrder: 1, color: "#DC2626" },
    { name: "Bed 2 (Receiving)", zone: "RECEIVING", room: null, displayOrder: 2, color: "#E8A0A0" },
    { name: "TRAUMA (R3)", zone: "TRAUMA", room: "R3", displayOrder: 3, color: "#F5D0D0" },
    { name: "Bed 3 (R3)", zone: "GENERAL", room: "R3", displayOrder: 4, color: "#FEF9E7" },
    { name: "Bed 4 (R1)", zone: "GENERAL", room: "R1", displayOrder: 5, color: "#FEF9E7" },
    { name: "Bed 5 (R1)", zone: "GENERAL", room: "R1", displayOrder: 6, color: "#FEF9E7" },
    { name: "Bed 6 (R2)", zone: "GENERAL", room: "R2", displayOrder: 7, color: "#FEF9E7" },
    { name: "Bed 7 (R2)", zone: "GENERAL", room: "R2", displayOrder: 8, color: "#FEF9E7" },
    { name: "Triage Chair", zone: "TRIAGE", room: null, displayOrder: 9, color: "#EAF2F8" },
  ];

  for (const bed of beds) {
    await prisma.bed.upsert({ where: { name: bed.name }, update: bed, create: bed });
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.doctor.upsert({
    where: { username: "admin" },
    update: {},
    create: { name: "Admin", username: "admin", passwordHash: adminPassword, role: "ADMIN" },
  });

  console.log("Seeded 9 beds and admin account");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
