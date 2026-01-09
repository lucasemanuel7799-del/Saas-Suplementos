"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  Store,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      // 1. Pega o usuário logado (Auth Global)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login"; // Redireciona se não estiver logado
        return;
      }

      // 2. Busca dados do perfil na tabela customers
      const { data: profile } = await supabase
        .from("customers")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setCustomer(profile);

      // 3. Busca histórico de pedidos em todas as lojas
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          stores ( name, logo_url )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersData) setOrders(ordersData);
      setLoading(false);
    }

    loadProfileData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-zinc-500">Carregando perfil...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header do Perfil */}
      <div className="bg-white border-b border-zinc-100 p-6 pt-12">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {customer?.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{customer?.full_name}</h1>
            <p className="text-sm text-zinc-500">{customer?.email}</p>
          </div>
        </div>
      </div>

      {/* Navegação Estilo iFood */}
      <div className="max-w-2xl mx-auto mt-6 px-4">
        <div className="flex border-b border-zinc-200 mb-6">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'border-b-2 border-red-500 text-red-600' : 'text-zinc-400'}`}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-sm font-bold transition-all ${activeTab === 'settings' ? 'border-b-2 border-red-500 text-red-600' : 'text-zinc-400'}`}
          >
            Meus Dados
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="space-y-4">
            {orders.length > 0 ? orders.map((order) => (
              <div key={order.id} className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {order.stores?.logo_url ? (
                        <img src={order.stores.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="text-zinc-300" size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 leading-tight">{order.stores?.name}</h4>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">Pedido #{order.id.slice(0,8)}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                    order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {order.status === 'delivered' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                    {order.status.toUpperCase()}
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-zinc-50 pt-4">
                  <div className="text-xs text-zinc-500">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • 
                    <span className="font-bold text-zinc-900 ml-1">R$ {order.total_amount.toFixed(2)}</span>
                  </div>
                  <button className="text-xs font-bold text-red-600 hover:underline">Ver Detalhes</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-20">
                <ShoppingBag className="mx-auto text-zinc-200 mb-2" size={48} />
                <p className="text-zinc-500 text-sm">Nenhum pedido realizado ainda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 space-y-6 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-4 text-zinc-700">
              <User className="text-zinc-400" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 font-bold uppercase">Nome Completo</p>
                <p className="font-medium">{customer?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-zinc-700">
              <MapPin className="text-zinc-400" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 font-bold uppercase">Telefone</p>
                <p className="font-medium">{customer?.phone || 'Não informado'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center gap-2 p-3 text-red-600 font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} /> Sair da Conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}