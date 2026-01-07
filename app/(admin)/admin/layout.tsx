import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar Fixa */}
      <AdminSidebar />

      {/* Área de Conteúdo (empurrada para a direita no desktop) */}
      <main className="md:pl-64 min-h-screen">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}