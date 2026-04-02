import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, specialty, bio, avatarUrl, isActive } = body;

  const provider = await prisma.provider.update({
    where: { id },
    data: { name, email, phone, specialty, bio, avatarUrl, isActive },
  });
  return NextResponse.json(provider);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.provider.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
