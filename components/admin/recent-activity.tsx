"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  PackagePlus, 
  ShoppingCart, 
  User, 
  Loader2, 
  Clock 
} from "lucide-react";

// Tipo dos dados que vêm do banco
interface OrderActivity {
  id: string;
  created_at: string;
  customer_name: string;
  total: number;
  status: string;
}

export function RecentActivity() {
  const supabase = createClient();
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // --- BUSCA INICIAL E REALTIME ---
  useEffect(() => {
    fetchActivities();

    // Inscreve-se para ouvir NOVOS pedidos (INSERT) na tabela 'orders'
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // Quando entra um pedido novo, adiciona no topo da lista
          const newOrder = payload.new as OrderActivity;
          setActivities((prev) => [newOrder, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchActivities() {
    try {
      // Busca os últimos 20 pedidos para preencher a lista
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, total, status")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO AUXILIAR: CALCULAR TEMPO RELATIVO ---
  // Transforma data ISO em "há X min", "há X horas"
  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "agora mesmo";
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="flex flex-col h-[400px] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Atividades Recentes</h3>
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full flex items-center gap-1">
            <Clock size={10} /> Em tempo real
        </span>
      </div>

      {/* Lista com Scroll */}
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-zinc-500">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <span className="text-xs">Carregando...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-zinc-500">
            <ShoppingCart size={32} className="opacity-20 mb-2" />
            <p className="text-sm">Nenhuma venda registrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-zinc-800/50 transition-colors animate-in slide-in-from-left-2 duration-300">
                
                {/* Ícone (Por enquanto focado em Pedidos) */}
                <div className="mt-0.5">
                   <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                      <ShoppingCart size={14} />
                   </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium text-zinc-300">
                    Novo pedido <span className="text-zinc-500 font-mono text-xs">#{item.id.slice(0,4)}</span>
                    <span className="text-zinc-500"> de </span>
                    <span className="text-green-400 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                    </span>
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">{item.customer_name}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(item.created_at)}</span>
                    <span>•</span>
                    <span className={`uppercase ${
                        item.status === 'paid' ? 'text-emerald-500' : 
                        item.status === 'canceled' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                        {item.status === 'paid' ? 'Pago' : item.status === 'pending' ? 'Pendente' : item.status}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}