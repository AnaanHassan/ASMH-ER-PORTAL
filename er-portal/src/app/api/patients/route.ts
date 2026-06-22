import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logPatientToSheet } from "@/lib/googleSheets";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const doctorId = searchParams.get("doctorId") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nidPassport: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (doctorId) where.attendingDoctorId = doctorId;

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { arrivalDateTime: "desc" },
    include: {
      bed: { select: { name: true } },
      attendingDoctor: { select: { name: true } },
    },
  });
  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patient = await prisma.patient.create({
    data: {
      name: body.name || "New Patient",
      age: body.age || null,
      gender: body.gender || null,
      bedId: body.bedId || null,
      arrivalDateTime: new Date(),
      attendingDoctorId: (session.user as Record<string, unknown>).id as string,
      allergyHistory: "NKDA",
    },
    include: {
      bed: { select: { name: true } },
      attendingDoctor: { select: { name: true } },
    },
  });

  // Log to Google Sheet (fire and forget)
  logPatientToSheet({
    id: patient.id,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    nidPassport: patient.nidPassport,
    hospitalNumber: patient.hospitalNumber,
    bedName: patient.bed?.name,
    arrivalDateTime: patient.arrivalDateTime,
    chiefComplaints: patient.chiefComplaints,
    attendingDoctorName: patient.attendingDoctor?.name,
  }).catch(() => {});

  return NextResponse.json(patient, { status: 201 });
}
