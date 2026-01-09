"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Search, Users, MapPin, ShoppingBag, TrendingUp, Star, 
  Cake, Gift, X, MessageCircle, Check, Percent, Settings2
} from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const supabase = createClient();
  
  // --- Estados Principais ---
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeName, setStoreName] = useState("Nossa Loja"); // Nome da loja para a mensagem

  // --- Estados de Aniversário ---
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayClients, setBirthdayClients] = useState<any[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]); // Controla quem já recebeu na sessão atual
  const [discountPercent, setDiscountPercent] = useState(10); // Porcentagem padrão

  useEffect(() => {
    fetchStoreData();
    fetchClientsFromOrders();
  }, []);

  // 1. Busca Nome da Loja (Para usar no WhatsApp)
  async function fetchStoreData() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('stores').select('name').eq('id', user?.id).single();
    if (data) setStoreName(data.name);
  }

  // 2. Busca Clientes baseada nos Pedidos (Para calcular LTV)
  async function fetchClientsFromOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_name, total_amount, created_at, address")
      .eq("store_id", user?.id)
      .order("created_at", { ascending: false });

    if (!orders) {
        setLoading(false);
        return;
    }

    const clientsMap: any = {};
    orders.forEach((order) => {
        const name = order.customer_name;
        
        if (!clientsMap[name]) {
            clientsMap[name] = {
                name: name,
                totalSpent: 0,
                ordersCount: 0,
                lastOrderDate: order.created_at,
                address: order.address,
                firstOrderDate: order.created_at
            };
        }

        clientsMap[name].totalSpent += order.total_amount;
        clientsMap[name].ordersCount += 1;
        
        if (new Date(order.created_at) > new Date(clientsMap[name].lastOrderDate)) {
            clientsMap[name].lastOrderDate = order.created_at;
            clientsMap[name].address = order.address;
        }
    });

    const clientsArray = Object.values(clientsMap).sort((a: any, b: any) => b.totalSpent - a.totalSpent);
    setClients(clientsArray);
    setLoading(false);
  }

  // 3. Busca Aniversariantes na tabela 'customers'
  async function openBirthdayModal() {
    setIsBirthdayModalOpen(true);
    setLoadingBirthdays(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: customers } = await supabase.from("customers").select("*").eq("store_id", user?.id);

    if (customers) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const bdayList = customers.filter(c => {
            if (!c.birth_date) return false;
            const [year, month, day] = c.birth_date.split('-'); 
            return parseInt(month) === currentMonth && parseInt(day) === currentDay;
        });

        setBirthdayClients(bdayList);
    }
    setLoadingBirthdays(false);
  }

  // 4. Envia WhatsApp + Cria Cupom Automático
  const sendBirthdayMessage = async (client: any) => {
    if (!client.phone) {
        toast.error("Cliente sem telefone cadastrado.");
        return;
    }

    const COUPON_CODE = `NIVER${discountPercent}`; // Ex: NIVER15
    
    // --- LÓGICA DE CUPOM AUTOMÁTICO ---
    try {
        const { data: { user } } = await supabase.auth.getUser();

        // Verifica se já existe
        const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('store_id', user?.id)
            .eq('code', COUPON_CODE)
            .single();

        // Se não existir, cria agora
        if (!existingCoupon) {
            const { error: createError } = await supabase.from('coupons').insert({
                store_id: user?.id,
                code: COUPON_CODE,
                description: `Cupom Automático Aniversário (${discountPercent}%)`,
                discount_type: "percentage",
                discount_value: discountPercent,
                usage_type: "all",
                active: true
            });

            if (createError) {
                console.error("Erro ao criar cupom:", createError);
            } else {
                toast.success(`Cupom ${COUPON_CODE} criado automaticamente!`);
            }
        }
    } catch (error) {
        console.error("Erro verificação cupom", error);
    }

    // --- MENSAGEM WHATSAPP ---
    const firstName = client.name.split(' ')[0];
    const message = `Olá ${firstName}! 🎂 Feliz aniversário! Para comemorar seu dia, a *${storeName}* preparou um presente especial: *${discountPercent}% OFF* na sua próxima compra com o cupom *${COUPON_CODE}*. Aproveite! 🎁`;
    
    const cleanPhone = client.phone.replace(/\D/g, ''); 
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setSentMessages(prev => [...prev, client.id]); 
  };

  // --- Auxiliares ---
  const getInitials = (name: string) => name.match(/(\b\S)?/g)?.join("").match(/(^\S|\S$)?/g)?.join("").toUpperCase().slice(0, 2);
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPIs
  const totalRevenue = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const averageTicket = clients.length > 0 ? totalRevenue / clients.length : 0;
  const newClientsCount = clients.filter(c => {
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - new Date(c.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30;
  }).length;

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      {/* CABEÇALHO */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Carteira de Clientes</h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie o relacionamento com seus compradores.</p>
        </div>

        <button 
            onClick={openBirthdayModal}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-pink-900/20 transition-all active:scale-95 animate-in fade-in slide-in-from-right-4"
        >
            <Cake size={18} />
            Aniversariantes do Dia
        </button>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Users size={16} className="text-blue-500"/>
                <span className="text-xs font-bold uppercase">Total de Clientes</span>
            </div>
            <p className="text-2xl font-bold text-white">{clients.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <TrendingUp size={16} className="text-emerald-500"/>
                <span className="text-xs font-bold uppercase">Gasto Médio (LTV)</span>
            </div>
            <p className="text-2xl font-bold text-white">R$ {averageTicket.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Star size={16} className="text-orange-500"/>
                <span className="text-xs font-bold uppercase">Novos (30 dias)</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{newClientsCount}</p>
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="shrink-0 relative max-w-md">
         <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
         <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nome..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
         />
      </div>

      {/* TABELA PRINCIPAL */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col flex-1 min-h-0">
        <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase font-medium text-xs shadow-md shadow-black/40">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Cliente</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Pedidos</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Total Gasto (LTV)</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Última Compra</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                 <tr><td colSpan={5} className="text-center py-20 text-zinc-500">Carregando carteira de clientes...</td></tr>
              ) : filteredClients.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-20 text-zinc-500">Nenhum cliente encontrado.</td></tr>
              ) : (
                filteredClients.map((client, index) => {
                    const lastDate = new Date(client.lastOrderDate);
                    const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 

                    let statusBadge;
                    if (diffDays <= 30) statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Ativo</span>;
                    else if (diffDays <= 90) statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Ausente</span>;
                    else statusBadge = <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">Inativo</span>;

                    const isTopClient = index < 3;

                    return (
                        <tr key={index} className="group hover:bg-zinc-800/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${isTopClient ? 'bg-orange-500 text-white border-orange-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                        {getInitials(client.name)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white text-sm">{client.name}</p>
                                            {isTopClient && <Star size={12} className="text-orange-500 fill-orange-500" />}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                                            <MapPin size={10} /> <span className="truncate max-w-[150px]">{client.address || "Sem endereço"}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                                    <ShoppingBag size={12} /> {client.ordersCount}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="font-bold text-emerald-400">R$ {client.totalSpent.toFixed(2).replace('.', ',')}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-zinc-400 text-xs">
                                <span>{new Date(client.lastOrderDate).toLocaleDateString('pt-BR')}</span>
                                <span className="block text-[10px] text-zinc-600">há {diffDays} dias</span>
                            </td>
                            <td className="px-6 py-4 text-center">{statusBadge}</td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE ANIVERSARIANTES --- */}
      {isBirthdayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center border border-pink-500/30">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Parabéns!</h2>
                            <p className="text-xs text-zinc-400">Clientes fazendo aniversário hoje.</p>
                        </div>
                    </div>
                    <button onClick={() => setIsBirthdayModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Área de Configuração do Desconto */}
                <div className="px-6 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Settings2 size={16} />
                        <span>Configurar Desconto:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative w-20">
                            <input 
                                type="number" 
                                min="1" 
                                max="100"
                                value={discountPercent} 
                                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-1.5 pl-3 pr-7 text-white text-sm font-bold focus:border-pink-500 outline-none text-center"
                            />
                            <Percent size={12} className="absolute right-2 top-2.5 text-zinc-500" />
                        </div>
                        <div className="text-xs font-mono text-pink-500 bg-pink-500/10 px-2 py-1.5 rounded border border-pink-500/20">
                            CUPOM: NIVER{discountPercent}
                        </div>
                    </div>
                </div>

                {/* Lista de Aniversariantes */}
                <div className="p-6 max-h-[350px] overflow-auto">
                    {loadingBirthdays ? (
                        <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-2">
                             <div className="animate-spin h-5 w-5 border-2 border-zinc-600 border-t-transparent rounded-full" />
                             Buscando datas...
                        </div>
                    ) : birthdayClients.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                                <Cake size={32} />
                            </div>
                            <p className="text-zinc-300 font-bold">Nenhum aniversariante hoje.</p>
                            <p className="text-zinc-500 text-sm mt-1">Verifique novamente amanhã!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {birthdayClients.map((client) => {
                                const isSent = sentMessages.includes(client.id);
                                
                                return (
                                    <div 
                                        key={client.id} 
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isSent ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800 hover:border-pink-500/30'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${isSent ? 'bg-emerald-500 text-white' : 'bg-pink-500 text-white'}`}>
                                                {getInitials(client.name)}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isSent ? 'text-emerald-400' : 'text-white'}`}>
                                                    {client.name}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {client.phone || "Sem telefone"}
                                                </p>
                                            </div>
                                        </div>

                                        {isSent ? (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                <Check size={14} /> Enviado
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => sendBirthdayMessage(client)}
                                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                                            >
                                                <MessageCircle size={16} />
                                                Enviar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}