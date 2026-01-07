"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Search, ShoppingBag, Calendar, Check, Package, 
  Truck, MapPin, ArrowRight, Eye, X, Receipt, 
  Loader2, Ban, AlertCircle, CheckCircle2
} from "lucide-react";

// --- TIPOS ---
interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  status: string;
  total: number;
  payment_method: string;
  store_id: string; // Importante para validar se o evento é da minha loja
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

const STATUS_FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

export default function OrdersPage() {
  const supabase = createClient();
  
  // --- ESTADOS ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados do Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchOrders();

    // --- REALTIME MAGIC ---
    // Inscreve-se para ouvir mudanças na tabela 'orders'
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // Quando houver uma mudança, atualizamos o estado localmente
          
          if (payload.eventType === 'INSERT') {
            // Novo Pedido: Adiciona no topo da lista
            setOrders((prev) => [payload.new as Order, ...prev]);
          } 
          else if (payload.eventType === 'UPDATE') {
            // Atualização: Encontra o pedido e atualiza os dados
            setOrders((prev) => prev.map((order) => 
              order.id === payload.new.id ? { ...order, ...payload.new as Order } : order
            ));
            
            // Se o modal estiver aberto com esse pedido, atualiza ele também
            if (selectedOrder?.id === payload.new.id) {
                setSelectedOrder(payload.new as Order);
            }
          } 
          else if (payload.eventType === 'DELETE') {
            // Exclusão: Remove da lista
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Limpa a conexão ao sair da página
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedOrder]); // Adicionei selectedOrder nas dependências

  // --- BUSCA INICIAL ---
  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- BUSCA ITENS ---
  async function openOrderDetails(order: Order) {
    setSelectedOrder(order);
    setLoadingItems(true);
    setOrderItems([]);

    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error("Erro itens:", error);
    } finally {
      setLoadingItems(false);
    }
  }

  // --- AÇÕES ---
  async function advanceStatus(order: Order) {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentIndex + 1];
    setUpdatingId(order.id);

    try {
      await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id);
      // Não precisa atualizar setOrders manualmente aqui, o Realtime fará isso!
    } catch (error) {
      alert("Erro ao atualizar.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCancelOrder() {
    if (!selectedOrder) return;
    if (!confirm("Tem certeza?")) return;
    setCanceling(true);
    try {
      await supabase.from("orders").update({ status: 'canceled' }).eq("id", selectedOrder.id);
      // O Realtime atualizará a lista e o modal
    } catch (error) {
      alert("Erro ao cancelar.");
    } finally {
      setCanceling(false);
    }
  }

  // --- VISUAL ---
  const getRowStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-2 border-l-yellow-500';
      case 'paid': return 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-2 border-l-emerald-500';
      case 'processing': return 'bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-l-blue-500';
      case 'shipped': return 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-l-amber-500';
      case 'delivered': return 'bg-purple-500/5 hover:bg-purple-500/10 border-l-2 border-l-purple-500';
      case 'canceled': return 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500 opacity-60 grayscale';
      default: return 'bg-zinc-900 hover:bg-zinc-800 border-l-2 border-l-transparent';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'text-yellow-500', icon: AlertCircle };
      case 'paid': return { label: 'Pago', color: 'text-emerald-500', icon: Check };
      case 'processing': return { label: 'Separando', color: 'text-blue-500', icon: Package };
      case 'shipped': return { label: 'Em Trânsito', color: 'text-amber-500', icon: Truck };
      case 'delivered': return { label: 'Entregue', color: 'text-purple-500', icon: CheckCircle2 };
      case 'canceled': return { label: 'Cancelado', color: 'text-red-500', icon: Ban };
      default: return { label: status, color: 'text-zinc-500', icon: AlertCircle };
    }
  };

  const getActionButton = (status: string) => {
    switch (status) {
      case 'pending': return { text: "Confirmar Pagto", icon: Check, style: "bg-emerald-600 hover:bg-emerald-500 text-white" };
      case 'paid': return { text: "Iniciar Separação", icon: Package, style: "bg-blue-600 hover:bg-blue-500 text-white" };
      case 'processing': return { text: "Despachar Entrega", icon: Truck, style: "bg-amber-600 hover:bg-amber-500 text-white" };
      case 'shipped': return { text: "Confirmar Entrega", icon: MapPin, style: "bg-purple-600 hover:bg-purple-500 text-white" };
      case 'delivered': return { text: "Concluído", icon: Check, style: "bg-zinc-800 text-purple-500 cursor-default border border-purple-500/20", disabled: true };
      case 'canceled': return { text: "Cancelado", icon: Ban, style: "bg-red-900/20 text-red-500 cursor-default", disabled: true };
      default: return { text: "Ver Detalhes", icon: ArrowRight, style: "bg-zinc-800 text-zinc-400" };
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-zinc-400 text-sm">Gerencie o fluxo de vendas da loja.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={30} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <div className="bg-zinc-800 p-3 rounded-full mb-3">
            <ShoppingBag size={30} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 text-sm">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 shadow-xl bg-zinc-900">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-black/40 text-[10px] uppercase font-bold text-zinc-500 tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Pedido / Cliente</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status Atual</th>
                <th className="px-4 py-3">Próxima Ação</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusConfig(order.status);
                const actionBtn = getActionButton(order.status);
                const rowStyle = getRowStyle(order.status);

                return (
                  <tr key={order.id} className={`transition-all duration-200 group ${rowStyle}`}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-[10px] opacity-70 bg-black/20 px-1.5 py-0.5 rounded">#{order.id.slice(0, 6)}</span>
                           <span className="font-bold text-zinc-100 text-sm group-hover:text-white transition-colors">{order.customer_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-70 text-xs"><Calendar size={12} />{new Date(order.created_at).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${statusInfo.color}`}><statusInfo.icon size={14} />{statusInfo.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => advanceStatus(order)} disabled={updatingId === order.id || actionBtn.disabled} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm ${actionBtn.style} ${updatingId === order.id ? "opacity-70 cursor-wait" : ""}`}>
                        {updatingId === order.id ? <Loader2 className="animate-spin" size={14} /> : <actionBtn.icon size={14} />}
                        {updatingId === order.id ? "..." : actionBtn.text}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div>
                            <div className="text-zinc-100 font-bold text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</div>
                            <div className="text-[10px] opacity-60 mt-0.5 uppercase">{order.payment_method || 'PIX'}</div>
                        </div>
                        <button onClick={() => openOrderDetails(order)} className="p-2 bg-black/20 hover:bg-black/40 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5" title="Ver Detalhes"><Eye size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${selectedOrder.status === 'canceled' ? 'bg-red-500/20 text-red-500' : 'bg-blue-600/20 text-blue-500'}`}>
                            {selectedOrder.status === 'canceled' ? <Ban size={24}/> : <Receipt size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedOrder.status === 'canceled' ? 'Pedido Cancelado' : 'Detalhes do Pedido'}</h3>
                            <p className="text-xs text-zinc-400 font-mono">ID: {selectedOrder.id}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-zinc-900/50">
                    {loadingItems ? <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-500"><Loader2 className="animate-spin text-blue-500" size={32} /><p className="text-sm">Carregando...</p></div> : orderItems.length === 0 ? <div className="text-center py-10 text-zinc-500"><p>Sem itens.</p></div> : (
                        <div className="space-y-3">
                            {orderItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 border border-zinc-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-950 text-zinc-400 font-bold text-xs border border-zinc-800">{item.quantity}x</div>
                                        <div><p className="text-sm font-medium text-zinc-200">{item.product_name}</p><p className="text-xs text-zinc-500">Unit: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</p></div>
                                    </div>
                                    <p className="font-bold text-white text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-5">
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-800/50">
                         <div><span className="block text-zinc-500 text-xs uppercase font-bold tracking-wider">Total</span><span className="block text-green-400 font-bold text-2xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)}</span></div>
                         <div className="text-right"><span className="block text-zinc-500 text-xs">Cliente</span><span className="block text-zinc-300 font-medium text-sm">{selectedOrder.customer_name}</span></div>
                    </div>
                    <button onClick={handleCancelOrder} disabled={canceling || selectedOrder.status === 'canceled' || selectedOrder.status === 'delivered'} className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all border ${selectedOrder.status === 'canceled' || selectedOrder.status === 'delivered' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-[0.98]'}`}>
                      {canceling ? <Loader2 className="animate-spin" size={16}/> : <Ban size={16} />}
                      {selectedOrder.status === 'canceled' ? 'Pedido já cancelado' : selectedOrder.status === 'delivered' ? 'Entrega concluída' : 'Cancelar Pedido'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}