"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Clock, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  ShoppingBag,
  ChevronDown,
  MapPin,
  CreditCard,
  Hash
} from "lucide-react";

// Configuração de Cores e Ícones
const STATUS_CONFIG: any = {
  pending: {
    label: "Pendente",
    color: "text-yellow-500",
    border: "border-yellow-500/50", // Borda mais visível
    bg: "bg-yellow-500/5",
    icon: Clock,
    next: "processing",
    actionLabel: "Aceitar"
  },
  processing: {
    label: "Em Separação",
    color: "text-blue-500",
    border: "border-blue-500/50",
    bg: "bg-blue-500/5",
    icon: PackageCheck,
    next: "delivering",
    actionLabel: "Enviar"
  },
  delivering: {
    label: "Em Entrega",
    color: "text-green-500",
    border: "border-green-500/50",
    bg: "bg-green-500/5",
    icon: Truck,
    next: "completed",
    actionLabel: "Concluir"
  },
  completed: {
    label: "Concluído",
    color: "text-purple-500",
    border: "border-purple-500/50",
    bg: "bg-purple-500/5",
    icon: CheckCircle2,
    next: null,
    actionLabel: "Fim"
  }
};

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  async function updateStatus(e: React.MouseEvent, orderId: string, currentStatus: string) {
    e.stopPropagation(); 
    
    const config = STATUS_CONFIG[currentStatus];
    if (!config.next) return;

    const nextStatus = config.next;

    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: nextStatus } : order
    ));

    await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pedidos</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie o fluxo de vendas da loja.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
            <div className="text-center py-10 text-zinc-500 animate-pulse">Carregando pedidos...</div>
        ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-10 text-center">
                <ShoppingBag className="mx-auto text-zinc-600 mb-4" size={48} />
                <h3 className="text-white font-bold">Nenhum pedido</h3>
                <p className="text-zinc-500 text-sm">Aguardando as primeiras vendas.</p>
            </div>
        ) : (
            orders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
              const isExpanded = expandedOrderId === order.id;
              const StatusIcon = status.icon;

              return (
                <div 
                  key={order.id}
                  // AQUI ESTAVA O ERRO: Agora usamos status.border e status.bg dinamicamente
                  className={`
                    relative overflow-hidden rounded-xl border transition-all duration-300
                    ${status.border} ${status.bg}
                    ${isExpanded ? 'shadow-lg bg-zinc-900/80' : 'hover:brightness-110'}
                  `}
                >
                  
                  {/* --- CARD PRINCIPAL (Clique para expandir) --- */}
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    
                    {/* ESQUERDA */}
                    <div className="flex items-start gap-4">
                        {/* Barra Lateral Colorida Grossa */}
                        <div className={`w-1.5 self-stretch rounded-full ${status.color.replace('text-', 'bg-')}`} />

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${status.color} ${status.border} bg-black/20`}>
                                    <Hash size={10} /> {order.id.slice(0, 4)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-white leading-tight">
                                {order.customer_name}
                            </h3>

                            {/* Resumo quando fechado */}
                            {!isExpanded && (
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 animate-in fade-in">
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <MapPin size={12} className="text-zinc-600" />
                                        <span className="truncate max-w-[150px]">{order.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                        <CreditCard size={12} className="text-zinc-600" />
                                        <span>{order.payment_method}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DIREITA */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-6 sm:pl-0 border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                        
                        {/* Botão de Ação Colorido */}
                        {status.next ? (
                            <button
                                onClick={(e) => updateStatus(e, order.id, order.status)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg ${status.bg} ${status.color} ${status.border} bg-opacity-50`}
                            >
                                <status.icon size={14} />
                                {status.actionLabel}
                            </button>
                        ) : (
                            <span className="text-xs font-bold text-zinc-500 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
                                <CheckCircle2 size={14} /> Concluído
                            </span>
                        )}

                        <div className="text-right">
                            <span className="block text-xs text-zinc-500 font-medium">Total</span>
                            <span className="font-bold text-white">
                                R$ {order.total_amount.toFixed(2).replace('.', ',')}
                            </span>
                        </div>

                        {/* Seta */}
                        <div className={`p-2 rounded-full text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-zinc-800 text-white' : 'hover:bg-zinc-800'}`}>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                  </div>

                  {/* --- EXPANDIDO --- */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/20 p-4 animate-in slide-in-from-top-2 duration-200">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/5">
                             <div className="space-y-1">
                                <p className="text-xs text-zinc-500 font-bold uppercase">Endereço de Entrega</p>
                                <p className="text-sm text-zinc-300 flex items-start gap-2">
                                    <MapPin size={14} className={`mt-0.5 ${status.color}`} />
                                    {order.address}
                                </p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-xs text-zinc-500 font-bold uppercase">Forma de Pagamento</p>
                                <p className="text-sm text-zinc-300 flex items-center gap-2">
                                    <CreditCard size={14} className={status.color} />
                                    {order.payment_method}
                                </p>
                             </div>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Itens do Pedido</p>
                            <div className="space-y-2">
                                {order.items && order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-800">
                                                {item.qty}x
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <span className={status.color}>{item.brand}</span>
                                                    <span>•</span>
                                                    <span>{item.flavor}</span>
                                                    <span>•</span>
                                                    <span className="text-zinc-400 bg-zinc-900 px-1.5 rounded border border-zinc-800">{item.volume}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-zinc-300">
                                            R$ {item.price ? item.price.toFixed(2).replace('.', ',') : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                  )}

                </div>
              );
            })
        )}
      </div>
    </div>
  );
}