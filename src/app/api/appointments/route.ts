import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/validations";
import { generateAppointmentCode } from "@/lib/utils";
import { addMinutes } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { providerId, serviceId, dateTime, patientName, patientEmail, patientPhone, patientNotes } =
      parsed.data;

    // Validate provider and service exist
    const service = await prisma.service.findFirst({
      where: { id: serviceId, providerId, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    // Check slot availability (no confirmed or pending non-expired appointments)
    const appointmentDateTime = new Date(dateTime);
    const slotEnd = addMinutes(appointmentDateTime, service.durationMin);

    const conflicting = await prisma.appointment.findFirst({
      where: {
        providerId,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        lockedUntil: { gt: new Date() },
        dateTime: {
          gte: appointmentDateTime,
          lt: slotEnd,
        },
      },
    });

    if (conflicting) {
      return NextResponse.json({ error: "El slot seleccionado ya no está disponible" }, { status: 409 });
    }

    // Generate unique code
    let code = generateAppointmentCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.appointment.findUnique({ where: { code } });
      if (!existing) break;
      code = generateAppointmentCode();
      attempts++;
    }

    // Create appointment with 15-minute lock
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

    const appointment = await prisma.appointment.create({
      data: {
        code,
        providerId,
        serviceId,
        dateTime: appointmentDateTime,
        durationMin: service.durationMin,
        patientName,
        patientEmail,
        patientPhone,
        patientNotes,
        depositAmount: service.depositAmount,
        lockedUntil,
        status: "PENDING_PAYMENT",
      },
    });

    return NextResponse.json({ appointmentId: appointment.id, code: appointment.code }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
