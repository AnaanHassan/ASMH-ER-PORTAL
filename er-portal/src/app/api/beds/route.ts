import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const beds = await prisma.bed.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      patients: {
        where: { status: "ACTIVE" },
        select: {
          id: true, name: true, age: true, gender: true,
          chiefComplaints: true, arrivalDateTime: true, dispositionType: true,
          attendingDoctor: { select: { name: true } },
        },
      },
    },
  });
  return NextResponse.json(beds);
}
