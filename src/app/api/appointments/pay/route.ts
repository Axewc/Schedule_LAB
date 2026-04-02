import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "Se requiere appointmentId" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
        provider: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (appointment.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "La cita no está en estado de pago pendiente" }, { status: 400 });
    }

    // Check lock hasn't expired
    if (appointment.lockedUntil && appointment.lockedUntil < new Date()) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "El tiempo de reserva ha expirado. Por favor inicie de nuevo." }, { status: 410 });
    }

    const amountInCents = Math.round(Number(appointment.depositAmount) * 100);

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "mxn",
      metadata: {
        appointmentId: appointment.id,
        appointmentCode: appointment.code,
      },
      description: `Anticipo — ${appointment.service.name} — ${appointment.code}`,
    });

    // Create payment record
    await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        stripePaymentId: paymentIntent.id,
        amount: appointment.depositAmount,
        currency: "MXN",
        status: "PENDING",
      },
      update: {
        stripePaymentId: paymentIntent.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}
