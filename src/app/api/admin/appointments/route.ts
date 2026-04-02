import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const date = searchParams.get("date");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date) {
    const d = new Date(date);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    where.dateTime = { gte: start, lte: end };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        service: { select: { name: true } },
        provider: { select: { name: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { dateTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, pages: Math.ceil(total / limit) });
}
