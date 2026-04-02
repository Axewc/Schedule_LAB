import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        email: true,
      },
    });
    return NextResponse.json(providers);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
