import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const services = await prisma.service.findMany({
      where: { providerId: id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        price: true,
        depositAmount: true,
      },
    });
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
