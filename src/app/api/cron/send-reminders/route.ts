import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addHours, startOfHour, endOfHour } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find appointments in 24 hours that haven't received a reminder
    const targetTime = addHours(new Date(), 24);
    const windowStart = startOfHour(targetTime);
    const windowEnd = endOfHour(targetTime);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        dateTime: { gte: windowStart, lte: windowEnd },
        emailLogs: {
          none: { type: "REMINDER_24H" },
        },
      },
      include: {
        service: { select: { name: true } },
        provider: { select: { name: true, email: true } },
      },
    });

    let sent = 0;
    for (const appointment of appointments) {
      await sendReminderEmail({
        ...appointment,
        patientNotes: appointment.patientNotes ?? undefined,
      });
      sent++;
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
