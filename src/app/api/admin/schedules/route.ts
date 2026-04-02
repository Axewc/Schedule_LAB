import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  const schedules = await prisma.schedule.findMany({
    where: providerId ? { providerId } : undefined,
    include: { provider: { select: { name: true } } },
    orderBy: [{ providerId: "asc" }, { dayOfWeek: "asc" }],
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { providerId, dayOfWeek, startTime, endTime, slotInterval } = body;

  if (!providerId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const schedule = await prisma.schedule.upsert({
    where: { providerId_dayOfWeek_startTime: { providerId, dayOfWeek: Number(dayOfWeek), startTime } },
    create: { providerId, dayOfWeek: Number(dayOfWeek), startTime, endTime, slotInterval: slotInterval ?? 30 },
    update: { endTime, slotInterval: slotInterval ?? 30, isActive: true },
  });
  return NextResponse.json(schedule, { status: 201 });
}
