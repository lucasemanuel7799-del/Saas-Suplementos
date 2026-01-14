"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Search, Users, MapPin, ShoppingBag, TrendingUp, Star, 
  Cake, Gift, X, MessageCircle, Check, Percent, Settings2, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const supabase = createClient();
  
  // --- Estados Principais ---
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Nossa Loja");

  // --- Estados de Aniversário ---
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayClients, setBirthdayClients] = useState<any[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(10);

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Busca ID e Nome da Loja (UUID Correto)
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (store) {
      setStoreId(store.id);
      setStoreName(store.name);
      // 2. Busca Clientes baseados nos Pedidos da loja
      await fetchClientsFromOrders(store.id);
    }
    setLoading(false);
  }

  async function fetchClientsFromOrders(sId: string) {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_name, total_amount, created_at, address")
      .eq("store_id", sId)
      .order("created_at", { ascending: false });

    if (!orders) return;

    const clientsMap: any = {};
    orders.forEach((order) => {
        const name = order.customer_name || "Cliente sem nome";
        
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

        clientsMap[name].totalSpent += Number(order.total_amount || 0);
        clientsMap[name].ordersCount += 1;
        
        if (new Date(order.created_at) > new Date(clientsMap[name].lastOrderDate)) {
            clientsMap[name].lastOrderDate = order.created_at;
            clientsMap[name].address = order.address;
        }
    });

    const clientsArray = Object.values(clientsMap).sort((a: any, b: any) => b.totalSpent - a.totalSpent);
    setClients(clientsArray);
  }

  async function openBirthdayModal() {
    if (!storeId) return;
    setIsBirthdayModalOpen(true);
    setLoadingBirthdays(true);
    
    const { data: customers } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", storeId);

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

  const sendBirthdayMessage = async (client: any) => {
    if (!client.phone) {
        toast.error("Cliente sem telefone cadastrado.");
        return;
    }
    if (!storeId) return;

    const COUPON_CODE = `NIVER${discountPercent}`;
    
    try {
        const { data: existingCoupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('store_id', storeId)
            .eq('code', COUPON_CODE)
            .maybeSingle();

        if (!existingCoupon) {
            await supabase.from('coupons').insert({
                store_id: storeId,
                code: COUPON_CODE,
                description: `Cupom de Aniversário (${discountPercent}%)`,
                discount_type: "percentage",
                discount_value: discountPercent,
                active: true
            });
            toast.success(`Cupom ${COUPON_CODE} ativado!`);
        }
    } catch (error) {
        console.error("Erro cupom", error);
    }

    const firstName = client.name.split(' ')[0];
    const message = `Olá ${firstName}! 🎂 Feliz aniversário! Para comemorar, a *${storeName}* te deu *${discountPercent}% OFF* na próxima compra com o cupom *${COUPON_CODE}*. Aproveite! 🎁`;
    
    const cleanPhone = client.phone.replace(/\D/g, ''); 
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
    setSentMessages(prev => [...prev, client.id]); 
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const averageTicket = clients.length > 0 ? totalRevenue / clients.length : 0;
  const newClientsCount = clients.filter(c => {
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - new Date(c.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)); 
      return diffDays <= 30;
  }).length;

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Carteira de Clientes</h1>
            <p className="text-zinc-400 text-sm mt-1">LTV e fidelização baseados no histórico da loja.</p>
        </div>

        <button 
            onClick={openBirthdayModal}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
        >
            <Cake size={18} />
            Aniversariantes do Dia
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Users size={16} className="text-blue-500"/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Base de Clientes</span>
            </div>
            <p className="text-2xl font-bold text-white">{clients.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <TrendingUp size={16} className="text-emerald-500"/>
                <span className="text-[10px] font-bold uppercase tracking-widest">LTV Médio</span>
            </div>
            <p className="text-2xl font-bold text-white">R$ {averageTicket.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Star size={16} className="text-orange-500"/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Novos (Mês)</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{newClientsCount}</p>
        </div>
      </div>

      <div className="shrink-0 relative max-w-md">
         <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
         <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-orange-500 outline-none transition-all"
         />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Frequência</th>
                <th className="px-6 py-4 text-right">Total Gasto</th>
                <th className="px-6 py-4 text-right">Última Visita</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                 <tr><td colSpan={5} className="text-center py-20 text-zinc-500"><Loader2 className="animate-spin mx-auto"/></td></tr>
              ) : filteredClients.length === 0 ? (
                 <tr><td colSpan={5} className="text-center py-20 text-zinc-500 font-bold uppercase text-xs">Nenhum registro encontrado</td></tr>
              ) : (
                filteredClients.map((client, index) => {
                    const lastDate = new Date(client.lastOrderDate);
                    const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 
                    const isTop = index < 3;

                    return (
                        <tr key={index} className="group hover:bg-zinc-800/20">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${isTop ? 'bg-orange-500 text-white border-orange-400' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                                        {getInitials(client.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white truncate max-w-[200px]">{client.name}</p>
                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 truncate max-w-[200px]"><MapPin size={10}/> {client.address || "Balcão"}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-zinc-400">
                                {client.ordersCount}x
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="font-bold text-emerald-400">R$ {client.totalSpent.toFixed(2).replace('.', ',')}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <p className="text-xs text-zinc-400">{lastDate.toLocaleDateString('pt-BR')}</p>
                                <p className="text-[10px] text-zinc-600">há {diffDays} dias</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {diffDays <= 30 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Ativo</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700 uppercase">Inativo</span>
                                )}
                            </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ANIVERSÁRIO */}
      {isBirthdayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Gift className="text-pink-500" size={24} />
                        <h2 className="text-lg font-bold text-white tracking-tight">Aniversariantes de Hoje</h2>
                    </div>
                    <button onClick={() => setIsBirthdayModalOpen(false)}><X className="text-zinc-500 hover:text-white" /></button>
                </div>

                <div className="px-6 py-3 bg-zinc-900 flex items-center justify-between border-b border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">🎁 Presente:</span>
                    <div className="flex items-center gap-2">
                        <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)} className="w-14 bg-zinc-950 border border-zinc-800 rounded p-1 text-center text-xs text-white font-bold" />
                        <span className="text-xs text-pink-500 font-bold">% OFF</span>
                    </div>
                </div>

                <div className="p-6 max-h-[300px] overflow-auto space-y-3">
                    {loadingBirthdays ? (
                        <Loader2 className="animate-spin mx-auto text-zinc-700" />
                    ) : birthdayClients.length === 0 ? (
                        <p className="text-center text-zinc-500 text-sm italic">Nenhum aniversariante encontrado para hoje.</p>
                    ) : (
                        birthdayClients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center text-xs font-bold border border-pink-500/20">{getInitials(client.name)}</div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{client.name}</p>
                                        <p className="text-[10px] text-zinc-500">{client.phone}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => sendBirthdayMessage(client)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${sentMessages.includes(client.id) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}
                                >
                                    {sentMessages.includes(client.id) ? <><Check size={14}/> Enviado</> : <><MessageCircle size={14}/> Enviar</>}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}