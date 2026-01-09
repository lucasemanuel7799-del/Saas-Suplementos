import { createClient } from "@/lib/supabase-server";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  PackageSearch,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

// Componente de Card de Estatística
function StatCard({ title, value, subtext, icon: Icon, trend }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-orange-500 group-hover:border-orange-500/30 transition-all shadow-lg">
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs">
        <span className={`flex items-center font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 && "+"} {trend}%
        </span>
        <span className="ml-2 text-zinc-500">{subtext}</span>
      </div>
      
      {/* Efeito de brilho laranja no fundo ao passar o mouse */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
    </div>
  );
}

export default async function AdminDashboard() {
  // --- CORREÇÃO AQUI: Adicionado 'await' ---
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Busca o nome do usuário na tabela pública
  const { data: userData } = await supabase
    .from("users" as any)
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const firstName = userData?.full_name?.split(" ")[0] || "Visitante";

  return (
    <div className="space-y-8">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{firstName}</span>
          </h1>
          <p className="text-zinc-400 mt-1">Aqui está o resumo da sua loja hoje.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900 text-xs text-zinc-400">
                {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
            </span>
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors">
                Ver Loja Online
            </button>
        </div>
      </div>

      {/* --- CARDS DE KPI (Dados Mockados para Visualização) --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Faturamento Total" 
            value="R$ 12.450" 
            subtext="em relação ao mês passado" 
            icon={DollarSign} 
            trend={12.5} 
        />
        <StatCard 
            title="Novos Pedidos" 
            value="45" 
            subtext="pedidos aguardando envio" 
            icon={ShoppingBag} 
            trend={8.2} 
        />
        <StatCard 
            title="Clientes Ativos" 
            value="1.203" 
            subtext="novos cadastros este mês" 
            icon={Users} 
            trend={-2.4} 
        />
        <StatCard 
            title="Ticket Médio" 
            value="R$ 245" 
            subtext="média por venda" 
            icon={TrendingUp} 
            trend={4.1} 
        />
      </div>

      {/* --- SEÇÃO INFERIOR (Tabela Recente e Atalhos) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tabela de Pedidos Recentes */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white">Pedidos Recentes</h3>
                <Link href="/admin/orders" className="text-xs text-orange-500 hover:text-orange-400 font-medium">
                    Ver todos
                </Link>
             </div>
             
             {/* Placeholder de Tabela Vazia */}
             <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-zinc-900 rounded-xl bg-zinc-900/20">
                <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                    <PackageSearch className="text-zinc-600" />
                </div>
                <p className="text-zinc-300 font-medium">Nenhum pedido recente</p>
                <p className="text-zinc-500 text-sm mt-1 max-w-xs">
                    Compartilhe o link da sua loja para começar a receber pedidos.
                </p>
             </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 h-fit">
              <h3 className="font-bold text-white mb-4">Acesso Rápido</h3>
              <div className="space-y-3">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all group">
                    <span className="text-sm text-zinc-300 group-hover:text-white">Cadastrar Produto</span>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-orange-500"/>
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all group">
                    <span className="text-sm text-zinc-300 group-hover:text-white">Configurar Entrega</span>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-orange-500"/>
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all group">
                    <span className="text-sm text-zinc-300 group-hover:text-white">Personalizar Loja</span>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-orange-500"/>
                 </button>
              </div>
          </div>

      </div>
    </div>
  );
}