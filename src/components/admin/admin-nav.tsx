"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Settings, Clock, LogOut, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Citas", icon: Calendar },
  { href: "/admin/schedules", label: "Horarios", icon: Clock },
  { href: "/admin/providers", label: "Prestadores", icon: Users },
  { href: "/admin/services", label: "Servicios", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0077B6] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-[#212529]">Dr. García</p>
            <p className="text-xs text-gray-500">Administración</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-[#0077B6] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
        <Link href="/" className="block">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 mt-1">
            <Ban className="w-4 h-4 mr-2" />
            Ver sitio
          </Button>
        </Link>
      </div>
    </nav>
  );
}
