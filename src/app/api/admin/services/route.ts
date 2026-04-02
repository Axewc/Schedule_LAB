import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  const services = await prisma.service.findMany({
    where: providerId ? { providerId } : undefined,
    include: { provider: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { providerId, name, description, durationMin, price, depositAmount } = body;

  if (!providerId || !name || !durationMin || price === undefined || depositAmount === undefined) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: { providerId, name, description, durationMin: Number(durationMin), price, depositAmount },
  });
  return NextResponse.json(service, { status: 201 });
}
