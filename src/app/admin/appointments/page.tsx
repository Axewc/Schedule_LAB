import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" | "outline" }> = {
  CONFIRMED: { label: "Confirmada", variant: "success" },
  PENDING_PAYMENT: { label: "Pendiente", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "error" },
  COMPLETED: { label: "Completada", variant: "secondary" },
  NO_SHOW: { label: "No se presentó", variant: "error" },
  EXPIRED: { label: "Expirada", variant: "outline" },
};

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const appointments = await prisma.appointment.findMany({
    include: {
      service: { select: { name: true } },
      provider: { select: { name: true } },
      payment: { select: { status: true, amount: true } },
    },
    orderBy: { dateTime: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212529]">Citas</h1>
        <p className="text-gray-500 text-sm mt-1">{appointments.length} citas registradas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0077B6]" />
            Todas las citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No hay citas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4">Código</th>
                    <th className="pb-3 pr-4">Paciente</th>
                    <th className="pb-3 pr-4">Servicio</th>
                    <th className="pb-3 pr-4">Fecha/Hora</th>
                    <th className="pb-3 pr-4">Anticipo</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((apt) => {
                    const status = STATUS_LABELS[apt.status];
                    return (
                      <tr key={apt.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono font-medium text-[#0077B6]">{apt.code}</td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{apt.patientName}</p>
                          <p className="text-gray-500 text-xs">{apt.patientEmail}</p>
                        </td>
                        <td className="py-3 pr-4">{apt.service.name}</td>
                        <td className="py-3 pr-4">
                          <p>{formatDate(apt.dateTime)}</p>
                          <p className="text-gray-500">{formatTime(apt.dateTime)}</p>
                        </td>
                        <td className="py-3 pr-4">{formatCurrency(apt.depositAmount)}</td>
                        <td className="py-3">
                          <Badge variant={status?.variant ?? "outline"}>{status?.label ?? apt.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
