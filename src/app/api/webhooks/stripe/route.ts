import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendConfirmationEmails } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const appointmentId = paymentIntent.metadata?.appointmentId;

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId in metadata" }, { status: 400 });
    }

    // Update payment
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: "COMPLETED" },
    });

    // Update appointment
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        lockedUntil: null,
      },
      include: {
        service: true,
        provider: true,
      },
    });

    // Send confirmation emails
    await sendConfirmationEmails({
      ...appointment,
      patientNotes: appointment.patientNotes ?? undefined,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
