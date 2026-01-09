import React from "react";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

// Imports
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import AdminSidebar from "@/components/admin/sidebar"; 
import SubscriptionBlocker from "@/components/admin/SubscriptionBlocker";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/admin/login");
  }

  // Verifica Assinatura
  // O retorno de checkSubscription deve ser algo como { isAllowed: boolean, plan: string, daysLeft: number }
  const access = await checkSubscription(user.id) as any; // Usamos 'as any' temporariamente para ignorar o erro de tipo se necessário

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans relative">
      
      {/* Bloqueador de Assinatura */}
      <SubscriptionBlocker />

      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50 bg-black border-r border-zinc-800">
        <AdminSidebar />
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative">
        
        {/* Barra de Aviso do Trial - Ajustada para evitar erro de propriedade */}
        {access.isAllowed && access.plan === 'trial' && (
            <div className="bg-orange-600/10 border-b border-orange-500/20 text-orange-200 text-xs font-bold py-2 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-orange-500"/>
                    <span>
                       Teste Grátis Ativo: <span className="text-white">{access.daysLeft || 0} dias restantes</span>.
                    </span>
                </div>
                <span className="opacity-50 text-[10px] uppercase tracking-wider">Plano Pro</span>
            </div>
        )}

        <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}