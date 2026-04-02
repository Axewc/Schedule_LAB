import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmails } from "@/lib/email";
import { differenceInHours } from "date-fns";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason as string | undefined;

    const appointment = await prisma.appointment.findUnique({
      where: { code },
      include: {
        service: { select: { name: true } },
        provider: { select: { name: true, email: true } },
        payment: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (!["CONFIRMED", "PENDING_PAYMENT"].includes(appointment.status)) {
      return NextResponse.json({ error: "La cita no puede ser cancelada en su estado actual" }, { status: 400 });
    }

    const hoursUntil = differenceInHours(appointment.dateTime, new Date());

    // Update appointment
    await prisma.appointment.update({
      where: { code },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: reason ?? "patient",
        lockedUntil: null,
      },
    });

    // Update payment status if exists
    if (appointment.payment && appointment.payment.status === "COMPLETED") {
      await prisma.payment.update({
        where: { appointmentId: appointment.id },
        data: { status: hoursUntil >= 24 ? "REFUNDED" : "COMPLETED" },
      });
    }

    // Send cancellation emails
    await sendCancellationEmails(
      {
        ...appointment,
        patientNotes: appointment.patientNotes ?? undefined,
      },
      hoursUntil
    );

    return NextResponse.json({ success: true, refundEligible: hoursUntil >= 24 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
