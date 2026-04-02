import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const email = searchParams.get("email");

    if (!code && !email) {
      return NextResponse.json({ error: "Se requiere código o email" }, { status: 400 });
    }

    const where = code ? { code } : { patientEmail: email as string };

    const appointments = await prisma.appointment.findMany({
      where: {
        ...where,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT", "COMPLETED"] },
      },
      include: {
        service: { select: { name: true, durationMin: true } },
        provider: { select: { name: true, specialty: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { dateTime: "desc" },
      take: 10,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
