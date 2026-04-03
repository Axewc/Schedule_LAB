import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, CheckCircle, Clock } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" | "outline" }> = {
  CONFIRMED: { label: "Confirmada", variant: "success" },
  PENDING_PAYMENT: { label: "Pendiente", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "error" },
  COMPLETED: { label: "Completada", variant: "secondary" },
  NO_SHOW: { label: "No se presentó", variant: "error" },
  EXPIRED: { label: "Expirada", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

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
    prisma.appointment.count({
      where: { dateTime: { gte: weekStart, lte: weekEnd }, status: "CONFIRMED" },
    }),
    prisma.appointment.count({ where: { status: "CONFIRMED" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const stats = [
    {
      title: "Citas hoy",
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: "text-[#0077B6]",
      bg: "bg-[#0077B6]/10",
    },
    {
      title: "Citas esta semana",
      value: weekAppointments.toString(),
      icon: Clock,
      color: "text-[#00B4D8]",
      bg: "bg-[#00B4D8]/10",
    },
    {
      title: "Total confirmadas",
      value: totalConfirmed.toString(),
      icon: CheckCircle,
      color: "text-[#06D6A0]",
      bg: "bg-[#06D6A0]/10",
    },
    {
      title: "Ingresos totales",
      value: formatCurrency(totalRevenue._sum.amount?.toString() ?? "0"),
      icon: DollarSign,
      color: "text-[#FFB703]",
      bg: "bg-[#FFB703]/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212529]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Hoy es {formatDate(now)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0077B6]" />
            Citas de hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No hay citas para hoy</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => {
                const status = STATUS_LABELS[apt.status];
                return (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center w-16">
                        <p className="font-bold text-[#0077B6]">{formatTime(apt.dateTime)}</p>
                      </div>
                      <div>
                        <p className="font-medium">{apt.patientName}</p>
                        <p className="text-sm text-gray-500">{apt.service.name}</p>
                      </div>
                    </div>
                    <Badge variant={status?.variant ?? "outline"}>{status?.label ?? apt.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
