import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function SchedulesPage() {
  const schedules = await prisma.schedule.findMany({
    include: { provider: { select: { name: true } } },
    orderBy: [{ providerId: "asc" }, { dayOfWeek: "asc" }],
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: { date: { gte: new Date() } },
    include: { provider: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212529]">Horarios</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona la disponibilidad semanal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0077B6]" />
            Horarios semanales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay horarios configurados</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium text-[#0077B6]">{DAYS[s.dayOfWeek]}</div>
                    <div className="text-sm">
                      <span>{s.startTime} — {s.endTime}</span>
                      <span className="text-gray-500 ml-2">({s.slotInterval} min por slot)</span>
                    </div>
                    <div className="text-sm text-gray-500">{s.provider.name}</div>
                  </div>
                  <Badge variant={s.isActive ? "success" : "outline"}>
                    {s.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fechas bloqueadas próximas</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedDates.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No hay fechas bloqueadas próximas</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd) => (
                <div key={bd.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{new Date(bd.date).toLocaleDateString("es-MX")}</span>
                    {bd.reason && <span className="text-gray-500 ml-2">— {bd.reason}</span>}
                  </div>
                  <span className="text-gray-500">{bd.provider.name}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
