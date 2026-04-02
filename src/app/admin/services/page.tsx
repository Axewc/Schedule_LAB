import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    include: {
      provider: { select: { name: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212529]">Servicios</h1>
        <p className="text-gray-500 text-sm mt-1">{services.length} servicios configurados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0077B6]" />
            Catálogo de servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No hay servicios configurados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4">Servicio</th>
                    <th className="pb-3 pr-4">Doctor</th>
                    <th className="pb-3 pr-4">Duración</th>
                    <th className="pb-3 pr-4">Precio</th>
                    <th className="pb-3 pr-4">Anticipo</th>
                    <th className="pb-3 pr-4">Citas</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{s.name}</p>
                        {s.description && (
                          <p className="text-gray-500 text-xs">{s.description.substring(0, 50)}...</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{s.provider.name}</td>
                      <td className="py-3 pr-4">{s.durationMin} min</td>
                      <td className="py-3 pr-4 font-medium">{formatCurrency(s.price)}</td>
                      <td className="py-3 pr-4 text-[#0077B6]">{formatCurrency(s.depositAmount)}</td>
                      <td className="py-3 pr-4 text-gray-600">{s._count.appointments}</td>
                      <td className="py-3">
                        <Badge variant={s.isActive ? "success" : "outline"}>
                          {s.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
