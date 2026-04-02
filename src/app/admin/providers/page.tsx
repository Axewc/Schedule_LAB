import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default async function ProvidersPage() {
  const providers = await prisma.provider.findMany({
    include: { _count: { select: { appointments: true, services: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212529]">Prestadores</h1>
        <p className="text-gray-500 text-sm mt-1">{providers.length} prestadores registrados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0077B6]" />
            Todos los prestadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No hay prestadores registrados</p>
          ) : (
            <div className="space-y-4">
              {providers.map((p) => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0077B6] rounded-full flex items-center justify-center text-white font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.specialty}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">{p._count.appointments} citas</p>
                    <p className="text-gray-500">{p._count.services} servicios</p>
                    <Badge variant={p.isActive ? "success" : "outline"} className="mt-1">
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
