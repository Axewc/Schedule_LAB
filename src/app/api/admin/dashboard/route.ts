import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [todayAppointments, weekAppointments, totalConfirmed, totalRevenue] = await Promise.all([
    prisma.appointment.findMany({
      where: { dateTime: { gte: todayStart, lte: todayEnd }, status: { not: "EXPIRED" } },
      include: {
        service: { select: { name: true } },
        provider: { select: { name: true } },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: { dateTime: { gte: weekStart, lte: weekEnd }, status: { not: "EXPIRED" } },
      include: {
        service: { select: { name: true } },
        provider: { select: { name: true } },
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    today: todayAppointments,
    week: weekAppointments,
    stats: {
      totalConfirmed,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
  });
}
