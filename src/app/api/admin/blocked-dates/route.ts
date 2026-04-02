import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  const blockedDates = await prisma.blockedDate.findMany({
    where: providerId ? { providerId } : undefined,
    orderBy: { date: "asc" },
  });
  return NextResponse.json(blockedDates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { providerId, date, reason } = body;

  if (!providerId || !date) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const blockedDate = await prisma.blockedDate.create({
    data: { providerId, date: new Date(date), reason },
  });
  return NextResponse.json(blockedDate, { status: 201 });
}
