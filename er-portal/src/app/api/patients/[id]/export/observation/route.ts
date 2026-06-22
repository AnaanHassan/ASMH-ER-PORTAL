import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildObservationChartFromTemplate } from "@/lib/docx/observationChart";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      bed: true,
      attendingDoctor: true,
      dcDoctor: true,
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const buffer = await buildObservationChartFromTemplate(patient);

  const filename = `Observation_${patient.name?.replace(/\s+/g, "_") ?? "patient"}_${patient.hospitalNumber ?? id}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
