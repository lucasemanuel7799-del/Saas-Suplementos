"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Store,
  Building2,
  ClipboardList, 
  TicketPercent, 
  Calculator,    
  CircleDollarSign 
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const menuItems = [
  { name: "Visão Geral", icon: LayoutDashboard, path: "/admin" },
  { name: "Pedidos", icon: ShoppingBag, path: "/admin/pedidos" },
  { name: "PDV / Caixa", icon: Calculator, path: "/admin/pdv" },
  { name: "Produtos", icon: Package, path: "/admin/produtos" },
  { name: "Stock", icon: ClipboardList, path: "/admin/inventory" },
  { name: "Clientes", icon: Users, path: "/admin/clientes" },
  { name: "Financeiro", icon: CircleDollarSign, path: "/admin/financeiro" },
  { name: "Promoções", icon: TicketPercent, path: "/admin/promocoes" },
  { name: "Configurações", icon: Settings, path: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [pendingCount, setPendingCount] = useState(0);
  const [storeInfo, setStoreInfo] = useState({ name: "Carregando...", id: "" });

  const fetchData = async () => {
    // 1. Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Busca Informações da Loja filtrando pelo OWNER_ID (Dono)
    // Usamos maybeSingle para evitar erros se a loja ainda estiver sendo criada
    const { data: store } = await supabase
        .from('stores')
        .select('name, id')
        .eq('owner_id', user.id) 
        .maybeSingle();
    
    if (store) {
        setStoreInfo({ name: store.name, id: store.id });

        // 3. Busca Contagem de Pedidos Pendentes usando o ID REAL da loja
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store.id) // Aqui usamos o ID da loja, não o do user
          .eq('status', 'pending');

        setPendingCount(count || 0);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime para pedidos
    const channel = supabase
      .channel('sidebar-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800 w-64 shrink-0 transition-all duration-300">
      
      {/* LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
            <Store size={20} className="text-white" />
          </div>
          Supples
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Gestão
        </p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const isOrders = item.name === "Pedidos";
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-zinc-900 text-white shadow-inner border border-zinc-800"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
              }`}
            >
              <item.icon
                size={18}
                className={`transition-colors ${
                  isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              
              <span>{item.name}</span>

              {isOrders && pendingCount > 0 && (
                <div className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold animate-pulse">
                    {pendingCount > 99 ? "+99" : pendingCount}
                </div>
              )}
              
              {isActive && (!isOrders || pendingCount === 0) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* RODAPÉ */}
      <div className="p-4 border-t border-zinc-800/50 space-y-3 bg-zinc-950">
        <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-700">
                <Building2 size={16} />
            </div>
            <div className="overflow-hidden min-w-0">
                <p className="text-[10px] uppercase font-bold text-zinc-500 truncate">Loja Conectada</p>
                <p className="text-sm font-bold text-white truncate leading-tight">
                    {storeInfo.name}
                </p>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate">
                    ID: {storeInfo.id || "Buscando..."}
                </p>
            </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={18} className="group-hover:text-red-400 text-zinc-500 transition-colors" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}