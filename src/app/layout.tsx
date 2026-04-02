import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="es" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#212529]">
        {children}
      </body>
    </html>
  );
}
