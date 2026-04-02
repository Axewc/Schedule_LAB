import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const allowed = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: body.status,
      ...(body.status === "CANCELLED" && { cancelledAt: new Date(), cancelledBy: "provider" }),
      ...(body.status === "CONFIRMED" && { confirmedAt: new Date() }),
    },
  });

  return NextResponse.json(appointment);
}
