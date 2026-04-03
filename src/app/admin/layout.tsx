import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not authenticated, render children directly (login page handles its own UI)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <AdminNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
