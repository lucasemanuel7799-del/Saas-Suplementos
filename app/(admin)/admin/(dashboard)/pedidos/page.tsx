"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Clock, PackageCheck, Truck, CheckCircle2, ShoppingBag, ChevronDown,
  MapPin, CreditCard, Hash, FileText, Upload, MessageCircle, 
  Trash2, Download, Search, Loader2
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: any = {
  pending: {
    label: "Pendente",
    color: "text-yellow-500",
    border: "border-yellow-500/50",
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Busca o ID da Loja (UUID)
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (store) {
      setStoreId(store.id);
      
      // 2. Busca pedidos da loja específica
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
    }
    
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

    // Update otimista
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: nextStatus } : order
    ));

    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    if (error) {
        toast.error("Erro ao atualizar status");
        fetchOrders(); // Reverte se der erro
    } else {
        toast.success(`Status: ${STATUS_CONFIG[nextStatus].label}`);
    }
  }

  const triggerUpload = (orderId: string) => {
    setUploadingOrderId(orderId);
    setTimeout(() => {
        if (fileInputRef.current) fileInputRef.current.click();
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingOrderId || !storeId) return;

    const toastId = toast.loading("Enviando nota fiscal...");

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uploadingOrderId}_${Date.now()}.${fileExt}`;
        const filePath = `${storeId}/${fileName}`; // Organizado por ID da Loja

        const { error: uploadError } = await supabase.storage
            .from('invoices')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('invoices')
            .getPublicUrl(filePath);

        await supabase
            .from("orders")
            .update({ invoice_url: publicUrl })
            .eq("id", uploadingOrderId);

        setOrders(prev => prev.map(o => o.id === uploadingOrderId ? { ...o, invoice_url: publicUrl } : o));
        toast.success("Nota Fiscal anexada!", { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error("Erro ao enviar arquivo.", { id: toastId });
    } finally {
        setUploadingOrderId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteInvoice = async (orderId: string) => {
    if(!confirm("Remover a nota fiscal deste pedido?")) return;
    try {
        await supabase.from("orders").update({ invoice_url: null }).eq("id", orderId);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoice_url: null } : o));
        toast.success("Nota removida.");
    } catch (error) {
        toast.error("Erro ao remover nota.");
    }
  };

  const sendToWhatsapp = (order: any) => {
    if (!order.invoice_url) return;
    const phone = order.customer_phone || ""; 
    const text = `Olá ${order.customer_name}! Segue a Nota Fiscal do seu pedido: ${order.invoice_url}`;
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toString().includes(searchTerm) || 
                          (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pb-10 scrollbar-hide">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />

      <div className="flex flex-col gap-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pedidos</h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie o fluxo de vendas e notas fiscais.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
             <div className="relative w-full sm:w-72">
                 <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                 <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar pedido..." className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:border-emerald-500 outline-none placeholder:text-zinc-600"/>
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                 {['all', 'pending', 'processing', 'delivering', 'completed'].map(st => (
                    <button key={st} onClick={() => setStatusFilter(st)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-all ${statusFilter === st ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {st === 'all' ? 'Todos' : STATUS_CONFIG[st].label}
                    </button>
                 ))}
             </div>
          </div>
      </div>

      <div className="space-y-3 flex-1">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">Carregando pedidos...</span>
            </div>
        ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-20 text-center">
                <ShoppingBag className="mx-auto text-zinc-700 mb-4" size={48} />
                <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Nenhum pedido encontrado</h3>
            </div>
        ) : (
            filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${status.border} ${status.bg} ${isExpanded ? 'shadow-2xl bg-zinc-900/90' : 'hover:bg-zinc-900/40'}`}>
                  
                  <div onClick={() => toggleExpand(order.id)} className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`w-1 self-stretch rounded-full ${status.color.replace('text-', 'bg-')}`} />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${status.color} ${status.border} bg-black/20 font-mono`}><Hash size={10} /> {order.id.toString().slice(0, 8)}</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight">{order.customer_name || "Cliente Balcão"}</h3>
                            
                            {!isExpanded && order.invoice_url && (
                                <div className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 w-fit">
                                    <FileText size={10} /> NF Disponível
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        {status.next ? (
                            <button onClick={(e) => updateStatus(e, order.id, order.status)} className={`text-[10px] font-bold uppercase px-3 py-2 rounded-lg border flex items-center gap-2 transition-all active:scale-95 ${status.bg} ${status.color} ${status.border}`}>
                                <status.icon size={14} /> {status.actionLabel}
                            </button>
                        ) : (
                            <span className="text-[10px] font-bold uppercase text-zinc-500 px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2"><CheckCircle2 size={14} /> Finalizado</span>
                        )}
                        <div className="text-right min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Total</span>
                            <span className="font-bold text-white text-lg font-mono">R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className={`p-2 rounded-lg text-zinc-500 transition-transform ${isExpanded ? 'rotate-180 bg-zinc-800 text-white' : ''}`}><ChevronDown size={16} /></div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/5 bg-black/20 p-6 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                             <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Logística</p>
                                    <p className="text-sm text-zinc-300 flex items-start gap-2 leading-relaxed"><MapPin size={16} className={`shrink-0 ${status.color}`} /> {order.address || "Retirada no Local"}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Forma de Pagamento</p>
                                    <p className="text-sm text-zinc-300 flex items-center gap-2 font-medium"><CreditCard size={16} className={status.color} /> {order.payment_method || "A combinar"}</p>
                                </div>
                             </div>

                             <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/50">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Nota Fiscal Eletrônica</h4>
                                {order.invoice_url ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                            <FileText className="text-blue-500 shrink-0" size={24}/>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white">invoice_pedido_{order.id.toString().slice(0,4)}.pdf</p>
                                                <p className="text-[10px] text-zinc-500">Documento pronto para o cliente</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => sendToWhatsapp(order)} className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase py-3 rounded-xl transition-all"><MessageCircle size={14}/> Enviar no WhatsApp</button>
                                            <a href={order.invoice_url} target="_blank" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase py-3 rounded-xl transition-all"><Download size={14}/> Baixar</a>
                                            <button onClick={() => handleDeleteInvoice(order.id)} className="flex items-center justify-center gap-2 bg-zinc-900 text-zinc-500 hover:text-red-500 text-[10px] font-bold uppercase py-3 rounded-xl transition-all border border-zinc-800 hover:border-red-500/20"><Trash2 size={14}/> Remover</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-zinc-600 leading-relaxed italic">Nenhuma nota fiscal foi anexada a este pedido ainda.</p>
                                        <button onClick={() => triggerUpload(order.id)} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase py-4 rounded-xl border border-zinc-700 transition-all"><Upload size={14}/> Anexar Nota Fiscal (PDF)</button>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-white/5 pb-2">Itens do Pedido</p>
                            <div className="grid gap-2">
                                {order.items && order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/30 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center text-xs font-bold text-white border border-zinc-800">{item.qty}x</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{item.brand} {item.flavor && `• ${item.flavor}`}</p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-zinc-300 font-mono">R$ {item.price ? item.price.toFixed(2).replace('.', ',') : '-'}</div>
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