import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updatePatientInSheet } from "@/lib/googleSheets";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      bed: true,
      attendingDoctor: { select: { id: true, name: true } },
      dcDoctor: { select: { id: true, name: true } },
    },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = { ...body };

  if (data.arrivalDateTime) data.arrivalDateTime = new Date(data.arrivalDateTime as string);
  if (data.dischargeDatetime) data.dischargeDatetime = new Date(data.dischargeDatetime as string);

  const intFields = ["age", "rr", "pr", "gcsE", "gcsV", "gcsM", "dcHR", "dcRR"];
  const floatFields = ["spo2Percent", "grbs", "tempC", "dcTemp"];
  for (const f of intFields) {
    if (f in data) data[f] = data[f] === "" || data[f] === null ? null : parseInt(String(data[f]));
  }
  for (const f of floatFields) {
    if (f in data) data[f] = data[f] === "" || data[f] === null ? null : parseFloat(String(data[f]));
  }

  if (data.dispositionType) {
    const statusMap: Record<string, string> = {
      DISCHARGED_ER: "DISCHARGED",
      ADMITTED: "ADMITTED",
      REFERRED: "REFERRED",
      DISCHARGED_REFERRED: "DISCHARGED",
    };
    data.status = statusMap[data.dispositionType as string] || data.status;
  }

  const patient = await prisma.patient.update({
    where: { id },
    data,
    include: { dcDoctor: { select: { name: true } } },
  });

  // Update Google Sheet when disposition changes
  if (data.dispositionType) {
    updatePatientInSheet({
      id: patient.id,
      dispositionType: patient.dispositionType,
      workingDiagnosis: patient.workingDiagnosis,
      dischargeDatetime: patient.dischargeDatetime,
      dcDoctorName: patient.dcDoctor?.name,
      status: patient.status,
    }).catch(() => {});
  }

  return NextResponse.json(patient);
}
