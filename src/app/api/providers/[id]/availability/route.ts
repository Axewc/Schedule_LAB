import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMinutes, format, parseISO, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!dateStr) {
      return NextResponse.json({ error: "Se requiere el parámetro date" }, { status: 400 });
    }

    const date = parseISO(dateStr);
    const dayOfWeek = date.getDay();

    // Fetch schedule for that day
    const schedule = await prisma.schedule.findFirst({
      where: { providerId: id, dayOfWeek, isActive: true },
    });

    if (!schedule) {
      return NextResponse.json([]);
    }

    // Check if date is blocked
    const blocked = await prisma.blockedDate.findFirst({
      where: {
        providerId: id,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
    });

    if (blocked) {
      return NextResponse.json([]);
    }

    // Get service duration
    let durationMin = schedule.slotInterval;
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, providerId: id },
        select: { durationMin: true },
      });
      if (service) durationMin = service.durationMin;
    }

    // Generate slots
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endH, endM, 0, 0);

    // Get existing appointments for that day (confirmed or pending_payment)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        providerId: id,
        dateTime: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        lockedUntil: {
          gt: new Date(),
        },
      },
      select: { dateTime: true, durationMin: true },
    });

    const confirmedAppointments = await prisma.appointment.findMany({
      where: {
        providerId: id,
        dateTime: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        status: "CONFIRMED",
      },
      select: { dateTime: true, durationMin: true },
    });

    const allBusy = [...existingAppointments, ...confirmedAppointments];

    // Generate all possible slots
    const slots: { time: string; available: boolean; dateTime: string }[] = [];
    let current = new Date(startDateTime);
    const now = new Date();

    while (isBefore(addMinutes(current, durationMin), endDateTime) || 
           addMinutes(current, durationMin).getTime() === endDateTime.getTime()) {
      const slotEnd = addMinutes(current, durationMin);

      // Skip past slots
      if (isBefore(current, now)) {
        current = addMinutes(current, schedule.slotInterval);
        continue;
      }

      // Check overlap with existing appointments
      const isOccupied = allBusy.some((appt) => {
        const apptStart = new Date(appt.dateTime);
        const apptEnd = addMinutes(apptStart, appt.durationMin);
        return (
          (isAfter(current, apptStart) || current.getTime() === apptStart.getTime()) &&
          isBefore(current, apptEnd)
        ) || (
          isAfter(slotEnd, apptStart) && 
          (isBefore(slotEnd, apptEnd) || slotEnd.getTime() === apptEnd.getTime())
        ) || (
          (isBefore(current, apptStart) || current.getTime() === apptStart.getTime()) &&
          (isAfter(slotEnd, apptEnd) || slotEnd.getTime() === apptEnd.getTime())
        );
      });

      slots.push({
        time: format(current, "HH:mm"),
        available: !isOccupied,
        dateTime: current.toISOString(),
      });

      current = addMinutes(current, schedule.slotInterval);
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
