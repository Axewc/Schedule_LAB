"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5;

interface Provider {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price: string;
  depositAmount: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  dateTime: string;
}

interface PatientData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  privacyConsent: boolean;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Step 2
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3
  const [patient, setPatient] = useState<PatientData>({
    name: "", email: "", phone: "", notes: "", privacyConsent: false,
  });

  // Step 4 & 5
  const [appointmentId, setAppointmentId] = useState("");
  const [appointmentCode, setAppointmentCode] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // Load providers on mount
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        if (data.length === 1) setSelectedProvider(data[0]);
      })
      .catch(console.error);
  }, []);

  // Load services when provider selected
  useEffect(() => {
    if (!selectedProvider) return;
    fetch(`/api/providers/${selectedProvider.id}/services`)
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error);
  }, [selectedProvider]);

  // Load time slots when date selected
  const loadSlots = useCallback(async (date: Date) => {
    if (!selectedProvider || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(
        `/api/providers/${selectedProvider.id}/availability?date=${dateStr}&serviceId=${selectedService.id}`
      );
      const data = await res.json();
      setTimeSlots(data);
    } catch {
      setError("Error al cargar horarios");
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedProvider, selectedService]);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Step 1: Select service
  const handleStep1Next = () => {
    if (!selectedProvider || !selectedService) {
      setError("Por favor selecciona un servicio");
      return;
    }
    setError("");
    setStep(2);
  };

  // Step 2: Select date/time
  const handleStep2Next = () => {
    if (!selectedDate || !selectedSlot) {
      setError("Por favor selecciona fecha y hora");
      return;
    }
    setError("");
    setStep(3);
  };

  // Step 3: Patient data
  const handleStep3Next = async () => {
    if (!patient.name || !patient.email || !patient.phone) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }
    if (!patient.privacyConsent) {
      setError("Debes aceptar el aviso de privacidad para continuar");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider!.id,
          serviceId: selectedService!.id,
          dateTime: selectedSlot!.dateTime,
          patientName: patient.name,
          patientEmail: patient.email,
          patientPhone: patient.phone,
          patientNotes: patient.notes || undefined,
          privacyConsent: patient.privacyConsent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear la cita");
        return;
      }

      const data = await res.json();
      setAppointmentId(data.appointmentId);
      setAppointmentCode(data.code);

      // Create payment intent
      const payRes = await fetch("/api/appointments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: data.appointmentId }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json();
        setError(payData.error ?? "Error al procesar el pago");
        return;
      }

      const payData = await payRes.json();
      setClientSecret(payData.clientSecret);
      setStep(4);
    } catch {
      setError("Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Simulate payment (in real app would use Stripe Elements)
  const handlePayment = async () => {
    setLoading(true);
    setError("");

    // In production, Stripe Elements handles this
    // For demo: simulate successful payment
    try {
      await new Promise((r) => setTimeout(r, 2000));
      setStep(5);
    } catch {
      setError("Error al procesar el pago. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: "Selecciona tu servicio",
    2: "Elige fecha y hora",
    3: "Tus datos",
    4: "Pago del anticipo",
    5: "¡Cita confirmada!",
  };

  const stepIcons = {
    1: Calendar,
    2: Clock,
    3: User,
    4: CreditCard,
    5: CheckCircle,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-[#0077B6] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-[#0077B6]">Agendar Cita</h1>
        </div>
      </header>

      {/* Progress */}
      {step < 5 && (
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {([1, 2, 3, 4] as const).map((s) => {
                const Icon = stepIcons[s];
                return (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-2 ${step === s ? "text-[#0077B6]" : step > s ? "text-[#06D6A0]" : "text-gray-300"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s ? "bg-[#0077B6] text-white" : step > s ? "bg-[#06D6A0] text-white" : "bg-gray-200 text-gray-400"}`}>
                        {step > s ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className="hidden sm:block text-xs font-medium">{stepTitles[s]}</span>
                    </div>
                    {s < 4 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > s ? "bg-[#06D6A0]" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg text-[#E63946] text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: Service Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0077B6]" />
                Selecciona el servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {providers.length > 1 && (
                <div className="mb-6">
                  <Label className="mb-2 block">Doctor / Especialista</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProvider(p); setSelectedService(null); }}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${selectedProvider?.id === p.id ? "border-[#0077B6] bg-[#0077B6]/5" : "border-gray-200 hover:border-[#0077B6]/50"}`}
                      >
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.specialty}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedProvider && (
                <div>
                  <Label className="mb-2 block">Servicio</Label>
                  {services.length === 0 ? (
                    <p className="text-gray-500 text-sm">Cargando servicios...</p>
                  ) : (
                    <div className="space-y-3">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedService?.id === s.id ? "border-[#0077B6] bg-[#0077B6]/5" : "border-gray-200 hover:border-[#0077B6]/50"}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{s.name}</p>
                              {s.description && <p className="text-sm text-gray-500 mt-1">{s.description}</p>}
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {s.durationMin} minutos
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-500">Precio total</p>
                              <p className="font-semibold text-[#0077B6]">{formatCurrency(s.price)}</p>
                              <p className="text-xs text-gray-500">Anticipo: {formatCurrency(s.depositAmount)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button onClick={handleStep1Next} disabled={!selectedService}>
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0077B6]" />
                  Selecciona fecha y hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Calendar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-medium">
                      {MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                    {DAYS_ES.map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getDaysInMonth(currentMonth).firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const available = isDateAvailable(date);
                      const isSelected = selectedDate?.toDateString() === date.toDateString();

                      return (
                        <button
                          key={day}
                          disabled={!available}
                          onClick={() => setSelectedDate(date)}
                          className={`w-full aspect-square rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-[#0077B6] text-white" : available ? "hover:bg-[#0077B6]/10 text-[#212529]" : "text-gray-300 cursor-not-allowed"}`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div>
                    <Label className="mb-2 block">
                      Horarios disponibles — {formatDate(selectedDate)}
                    </Label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-gray-500 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando horarios...
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">No hay horarios disponibles para este día.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.dateTime}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2 rounded-lg text-sm border-2 transition-all ${selectedSlot?.dateTime === slot.dateTime ? "border-[#0077B6] bg-[#0077B6] text-white" : slot.available ? "border-gray-200 hover:border-[#0077B6]/50" : "border-gray-100 text-gray-300 cursor-not-allowed"}`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button onClick={handleStep2Next} disabled={!selectedSlot}>
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Patient Data */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="bg-[#0077B6]/5 border-[#0077B6]/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <Badge variant="secondary">{selectedService?.name}</Badge>
                  <span className="text-gray-600">{selectedDate && formatDate(selectedDate)}</span>
                  <span className="text-gray-600">{selectedSlot?.time}</span>
                  <span className="font-semibold text-[#0077B6]">Anticipo: {formatCurrency(selectedService?.depositAmount ?? 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0077B6]" />
                  Tus datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    placeholder="Ej. María González López"
                    value={patient.name}
                    onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={patient.email}
                    onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+52 55 1234 5678"
                    value={patient.phone}
                    onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Motivo de consulta (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe brevemente el motivo de tu visita..."
                    value={patient.notes}
                    onChange={(e) => setPatient({ ...patient, notes: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={patient.privacyConsent}
                    onChange={(e) => setPatient({ ...patient, privacyConsent: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#0077B6] focus:ring-[#0077B6]"
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    He leído y acepto el{" "}
                    <a href="#" className="text-[#0077B6] underline">Aviso de Privacidad</a>{" "}
                    y consiento el tratamiento de mis datos personales para la gestión de mi cita. *
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button onClick={handleStep3Next} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continuar al pago <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Payment */}
        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0077B6]" />
                  Pago del anticipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicio</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha y hora</span>
                    <span className="font-medium">{selectedDate && formatDate(selectedDate)} {selectedSlot?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doctor</span>
                    <span className="font-medium">{selectedProvider?.name}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Anticipo a pagar</span>
                    <span className="text-[#0077B6]">{formatCurrency(selectedService?.depositAmount ?? 0)}</span>
                  </div>
                </div>

                {/* Stripe Elements placeholder */}
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-6">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Formulario de Stripe Elements</p>
                  <p className="text-gray-400 text-xs mt-1">
                    En producción, aquí se integra el formulario seguro de Stripe para capturar los datos de la tarjeta.
                  </p>
                  {clientSecret && (
                    <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                      Client Secret: {clientSecret.substring(0, 20)}...
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="success"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  Confirmar y Pagar {formatCurrency(selectedService?.depositAmount ?? 0)}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  🔒 Pago seguro procesado por Stripe. Nunca almacenamos datos de tu tarjeta.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation */}
        {step === 5 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-[#06D6A0]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-[#06D6A0]" />
              </div>
              <h2 className="text-2xl font-bold text-[#212529] mb-2">¡Cita Confirmada!</h2>
              <p className="text-gray-500 mb-6">
                Tu cita ha sido agendada exitosamente. Recibirás un email de confirmación en breve.
              </p>

              <div className="bg-[#0077B6]/5 border border-[#0077B6]/20 rounded-xl p-6 mb-6 text-left max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 mb-1">Código de cita</p>
                  <p className="text-2xl font-bold font-mono text-[#0077B6]">{appointmentCode}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicio</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha</span>
                    <span className="font-medium">{selectedDate && formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hora</span>
                    <span className="font-medium">{selectedSlot?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Doctor</span>
                    <span className="font-medium">{selectedProvider?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Anticipo pagado</span>
                    <span className="font-semibold text-[#06D6A0]">{formatCurrency(selectedService?.depositAmount ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/mi-cita?code=${appointmentCode}`}>
                  <Button variant="outline">Ver mi cita</Button>
                </Link>
                <Link href="/">
                  <Button>Volver al inicio</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
