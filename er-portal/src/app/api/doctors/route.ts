import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = (session.user as any).role === "ADMIN";

  const doctors = await prisma.doctor.findMany({
    where: isAdmin ? {} : { active: true },
    select: {
      id: true,
      name: true,
      role: true,
      ...(isAdmin ? { username: true, active: true } : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(doctors);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name || !body.username || !body.password) {
    return NextResponse.json({ error: "name, username, and password are required" }, { status: 400 });
  }

  const existing = await prisma.doctor.findUnique({ where: { username: body.username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const doctor = await prisma.doctor.create({
    data: {
      name: body.name,
      username: body.username,
      passwordHash,
      role: body.role || "DOCTOR",
      createdAt: new Date(),
    },
    select: { id: true, name: true, username: true, role: true, active: true },
  });
  return NextResponse.json(doctor, { status: 201 });
}
