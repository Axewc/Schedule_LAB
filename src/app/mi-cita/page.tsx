"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, Search, AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Appointment {
  id: string;
  code: string;
  status: string;
  dateTime: string;
  patientName: string;
  patientEmail: string;
  depositAmount: string;
  service: { name: string; durationMin: number };
  provider: { name: string; specialty: string };
  payment?: { status: string; amount: string };
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" | "outline" }> = {
  CONFIRMED: { label: "Confirmada", variant: "success" },
  PENDING_PAYMENT: { label: "Pago pendiente", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "error" },
  COMPLETED: { label: "Completada", variant: "secondary" },
  NO_SHOW: { label: "No se presentó", variant: "error" },
  EXPIRED: { label: "Expirada", variant: "outline" },
};

function MiCitaContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState({ code: searchParams.get("code") ?? "", email: "" });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setSearch({ code, email: "" });
      handleSearch({ code, email: "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchData = search) => {
    if (!searchData.code && !searchData.email) {
      setError("Ingresa tu código de cita o email");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchData.code) params.set("code", searchData.code);
      if (searchData.email) params.set("email", searchData.email);

      const res = await fetch(`/api/appointments/lookup?${params.toString()}`);
      if (!res.ok) throw new Error("Error al buscar");
      const data = await res.json();
      setAppointments(data);
    } catch {
      setError("Error al buscar la cita. Por favor intenta de nuevo.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (code: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    setCancellingId(code);

    try {
      const res = await fetch(`/api/appointments/${code}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "patient" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al cancelar");
        return;
      }

      const data = await res.json();
      setCancelSuccess(true);
      setAppointments((prev) =>
        prev.map((a) => a.code === code ? { ...a, status: "CANCELLED" } : a)
      );

      if (data.refundEligible) {
        alert("Tu cita ha sido cancelada. Se iniciará el proceso de reembolso del anticipo en 3-5 días hábiles.");
      } else {
        alert("Tu cita ha sido cancelada. Lamentablemente, al cancelar con menos de 24 horas, el anticipo no es reembolsable.");
      }
    } catch {
      setError("Error al cancelar la cita");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-[#0077B6] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-[#0077B6]">Gestionar Mi Cita</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#0077B6]" />
              Buscar mi cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="code">Código de cita</Label>
                <Input
                  id="code"
                  placeholder="CIT-XXXXXX"
                  value={search.code}
                  onChange={(e) => setSearch({ ...search, code: e.target.value.toUpperCase() })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">O busca por email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={search.email}
                  onChange={(e) => setSearch({ ...search, email: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg text-[#E63946] text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Buscar cita
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <>
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No se encontraron citas</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Verifica tu código o email e intenta de nuevo.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => {
                  const status = STATUS_LABELS[appointment.status] ?? { label: appointment.status, variant: "outline" as const };
                  const canCancel = ["CONFIRMED", "PENDING_PAYMENT"].includes(appointment.status);
                  const isPast = new Date(appointment.dateTime) < new Date();

                  return (
                    <Card key={appointment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold font-mono text-[#0077B6]">{appointment.code}</span>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-lg font-semibold">{appointment.service.name}</p>
                            <p className="text-gray-500 text-sm">{appointment.provider.name}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                          <div>
                            <p className="text-gray-500">Fecha</p>
                            <p className="font-medium">{formatDate(appointment.dateTime)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Hora</p>
                            <p className="font-medium">{formatTime(appointment.dateTime)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duración</p>
                            <p className="font-medium">{appointment.service.durationMin} min</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Anticipo</p>
                            <p className="font-medium">{formatCurrency(appointment.depositAmount)}</p>
                          </div>
                        </div>

                        {cancelSuccess && appointment.status === "CANCELLED" && (
                          <div className="mb-4 p-3 bg-[#06D6A0]/10 border border-[#06D6A0]/30 rounded-lg text-sm flex items-center gap-2 text-[#06D6A0]">
                            <CheckCircle className="w-4 h-4" />
                            Cita cancelada exitosamente
                          </div>
                        )}

                        {canCancel && !isPast && (
                          <div className="border-t pt-4 flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancel(appointment.code)}
                              disabled={cancellingId === appointment.code}
                            >
                              {cancellingId === appointment.code ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Cancelar cita
                            </Button>
                            <p className="text-xs text-gray-500 self-center">
                              * Cancelaciones con ≥24h de anticipación son elegibles para reembolso
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm mb-3">¿Necesitas agendar una nueva cita?</p>
          <Link href="/agendar">
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Agendar nueva cita
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MiCitaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077B6]" />
      </div>
    }>
      <MiCitaContent />
    </Suspense>
  );
}
