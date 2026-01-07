// IMPORTANTE: Remova as chaves { } se existirem
import AdminSidebar from "@/components/admin/sidebar"; 

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar (Desktop) */}
      {/* ATENÇÃO: Se sua tela for pequena, a classe 'hidden md:block' esconde a sidebar. Aumente a janela! */}
      <aside className="w-64 fixed h-full hidden md:block border-r border-zinc-800 z-10">
        <AdminSidebar />
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 md:ml-64 min-h-screen bg-black relative">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}