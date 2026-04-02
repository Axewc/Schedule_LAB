import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0077B6] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-[#0077B6] text-lg">Consultorio Dr. García</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#servicios" className="hover:text-[#0077B6] transition-colors">Servicios</a>
            <a href="#doctor" className="hover:text-[#0077B6] transition-colors">El Doctor</a>
            <a href="#ubicacion" className="hover:text-[#0077B6] transition-colors">Ubicación</a>
            <a href="#testimonios" className="hover:text-[#0077B6] transition-colors">Testimonios</a>
          </nav>
          <Link href="/agendar">
            <Button size="sm">Agendar Cita</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0077B6] to-[#00B4D8] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Tu salud, nuestra prioridad.<br />
            <span className="text-[#06D6A0]">Agenda tu cita en minutos.</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Sin llamadas, sin registros complicados. Selecciona tu servicio, elige tu horario y confirma con pago seguro en línea.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agendar">
              <Button size="lg" variant="success" className="text-base font-semibold w-full sm:w-auto">
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Cita Ahora
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href="/mi-cita">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Consultar Mi Cita
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#06D6A0]" />
              Sin registro requerido
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#06D6A0]" />
              Confirmación inmediata
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#06D6A0]" />
              Pago 100% seguro
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#212529] mb-4">¿Cómo funciona?</h2>
          <p className="text-center text-gray-500 mb-12">Agenda tu cita en 3 sencillos pasos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: Calendar, title: "Elige fecha y servicio", desc: "Selecciona el servicio que necesitas y el horario disponible que más te convenga." },
              { step: "2", icon: CreditCard, title: "Paga el anticipo", desc: "Asegura tu lugar con un pequeño anticipo. Pago seguro con tarjeta vía Stripe." },
              { step: "3", icon: Mail, title: "Recibe confirmación", desc: "Recibirás un email con todos los detalles y tu código único de cita." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-[#0077B6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-[#0077B6]" />
                </div>
                <div className="w-8 h-8 bg-[#0077B6] rounded-full flex items-center justify-center mx-auto -mt-8 mb-4 text-white font-bold text-sm">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="py-16 px-4 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#212529] mb-4">Nuestros Servicios</h2>
          <p className="text-center text-gray-500 mb-12">Atención médica de calidad con tecnología de punta</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Consulta General", desc: "Diagnóstico y tratamiento de enfermedades comunes", duration: "30 min", price: "$500" },
              { name: "Limpieza Dental", desc: "Limpieza profunda y pulido dental profesional", duration: "60 min", price: "$800" },
              { name: "Revisión Preventiva", desc: "Chequeo completo de salud y diagnóstico preventivo", duration: "45 min", price: "$650" },
              { name: "Extracción Dental", desc: "Extracción segura con anestesia local", duration: "60 min", price: "$1,200" },
              { name: "Ortodoncia Consulta", desc: "Evaluación inicial para brackets o alineadores", duration: "45 min", price: "$300" },
              { name: "Urgencias", desc: "Atención inmediata para casos urgentes", duration: "30 min", price: "$700" },
            ].map((service) => (
              <Card key={service.name} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{service.desc}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </span>
                    <span className="font-semibold text-[#0077B6]">Desde {service.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/agendar">
              <Button size="lg">Ver disponibilidad y agendar</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Doctor */}
      <section id="doctor" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-48 h-48 bg-gradient-to-br from-[#0077B6] to-[#00B4D8] rounded-2xl mx-auto md:mx-0 flex items-center justify-center">
                <span className="text-white text-5xl font-bold">DG</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#212529] mb-4">Dr. Alejandro García</h2>
              <p className="text-[#0077B6] font-medium mb-4">Médico General y Odontólogo</p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Con más de 15 años de experiencia, el Dr. García se especializa en brindar atención médica y dental de alta calidad en un ambiente cálido y profesional. Egresado de la UNAM con especialidad en Odontología Restaurativa.
              </p>
              <div className="space-y-2">
                {["Cédula Profesional: 12345678", "15+ años de experiencia", "Más de 5,000 pacientes atendidos"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-[#06D6A0] flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="py-16 px-4 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#212529] mb-4">Lo que dicen nuestros pacientes</h2>
          <p className="text-center text-gray-500 mb-12">Más de 500 reseñas con calificación promedio de 4.9/5</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "María González", text: "Excelente atención. Agendé mi cita en menos de 2 minutos y el doctor fue muy profesional.", rating: 5 },
              { name: "Carlos Mendoza", text: "El sistema de pago en línea es muy práctico. Ya no tengo que llamar para hacer mis citas.", rating: 5 },
              { name: "Ana Torres", text: "La mejor experiencia médica que he tenido. El consultorio es moderno y muy limpio.", rating: 5 },
            ].map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#FFB703] fill-[#FFB703]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <p className="font-medium text-sm">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section id="ubicacion" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#212529] mb-12">¿Dónde estamos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0077B6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#0077B6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Dirección</h3>
                  <p className="text-gray-600 text-sm">Av. Insurgentes Sur 1234, Piso 3<br />Col. Del Valle, CDMX 03100</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0077B6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#0077B6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Horarios</h3>
                  <p className="text-gray-600 text-sm">
                    Lunes - Viernes: 9:00 - 19:00<br />
                    Sábado: 9:00 - 14:00<br />
                    Domingo: Cerrado
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0077B6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#0077B6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Teléfono</h3>
                  <p className="text-gray-600 text-sm">+52 55 1234 5678</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0077B6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#0077B6]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-gray-600 text-sm">contacto@consultoriogarcia.com</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl h-64 md:h-auto flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Mapa embebido de Google Maps</p>
                <p className="text-xs">Av. Insurgentes Sur 1234, CDMX</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#0077B6] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para agendar tu cita?</h2>
          <p className="text-blue-100 mb-8">En menos de 3 minutos tendrás tu cita confirmada. Sin complicaciones.</p>
          <Link href="/agendar">
            <Button size="lg" variant="success" className="text-base font-semibold">
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Mi Cita Ahora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#212529] text-gray-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#0077B6] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-white font-semibold">Consultorio Dr. García</span>
              </div>
              <p className="text-sm">Atención médica de calidad con un toque humano.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Servicios</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#servicios" className="hover:text-white transition-colors">Consulta General</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Limpieza Dental</a></li>
                <li><a href="#servicios" className="hover:text-white transition-colors">Urgencias</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Pacientes</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/agendar" className="hover:text-white transition-colors">Agendar Cita</Link></li>
                <li><Link href="/mi-cita" className="hover:text-white transition-colors">Mi Cita</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Aviso de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2024 Consultorio Dr. García. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#06D6A0]" />
              <span>Pagos seguros con Stripe</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
