import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consultorio Médico — Agenda tu Cita en Línea",
  description:
    "Agenda tu cita médica de forma rápida y segura. Sin registro, confirmación inmediata y pago seguro en línea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#212529]">
        {children}
      </body>
    </html>
  );
}
