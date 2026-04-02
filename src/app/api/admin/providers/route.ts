import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const providers = await prisma.provider.findMany({
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(providers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, specialty, bio, avatarUrl } = body;

  if (!name || !email || !specialty) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: { name, email, phone, specialty, bio, avatarUrl },
  });
  return NextResponse.json(provider, { status: 201 });
}
