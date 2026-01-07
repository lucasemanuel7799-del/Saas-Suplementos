"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Search,
  Loader2,
  RefreshCcw
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  price: number;
  cost_price: number;
}

export default function InventoryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 1. CARREGAMENTO INICIAL E ESCUTADOR REALTIME
  useEffect(() => {
    loadInventory();

    const channel = supabase
      .channel('inventory-sync')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'products' }, 
        (payload) => {
          // Atualiza a tela se o banco mudar (visto de outro lugar)
          setItems(prev => prev.map(item => 
            item.id === payload.new.id ? { ...item, ...payload.new } : item
          ));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadInventory() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("products")
      .select("id, name, stock, min_stock, price, cost_price")
      .eq("store_id", userData.user.id)
      .order("name", { ascending: true });

    if (data) setItems(data);
    setLoading(false);
  }

  // 2. ATUALIZAÇÃO RÁPIDA (SALVA NO BANCO E MUDA A COR NA HORA)
  async function updateStock(id: string, newStock: number) {
    if (isNaN(newStock) || newStock < 0) return;
    
    setUpdatingId(id);

    // Passo Otimista: Muda na tela antes mesmo do banco responder
    setItems(prev => prev.map(item => item.id === id ? { ...item, stock: newStock } : item));

    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      console.error("Erro ao salvar:", error.message);
      loadInventory(); // Reverte se der erro
    }
    
    setUpdatingId(null);
  }

  // CÁLCULOS DOS CARDS
  const totalStockQty = items.reduce((acc, i) => acc + (i.stock || 0), 0);
  const totalCostValue = items.reduce((acc, i) => acc + ((i.stock || 0) * (i.cost_price || 0)), 0);
  const totalSaleValue = items.reduce((acc, i) => acc + ((i.stock || 0) * (i.price || 0)), 0);

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Lógica de Cores da Linha (Solicitado: Vermelho, Amarelo, Verde)
  const getRowStyle = (stock: number, min: number) => {
    if (stock <= min) return "bg-red-500/10 border-red-500/30 text-red-100"; // Baixo
    if (stock <= min * 2) return "bg-yellow-500/10 border-yellow-500/30 text-yellow-100"; // Médio
    return "bg-green-500/10 border-green-500/30 text-green-100"; // Cheio
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* TÍTULO ALINHADO - Sem paddings extras para bater com as outras páginas */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Estoque</h1>
          <p className="text-zinc-400 text-sm">Controle de faturamento e níveis de reposição.</p>
        </div>
        <button 
          onClick={loadInventory}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
          title="Recarregar dados"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Itens em Estoque</p>
            <h3 className="text-2xl font-black text-white">{totalStockQty}</h3>
          </div>
          <div className="text-blue-500 p-3 bg-blue-500/10 rounded-xl"><Package size={20}/></div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Custo Total</p>
            <h3 className="text-2xl font-black text-white">R$ {totalCostValue.toLocaleString()}</h3>
          </div>
          <div className="text-emerald-500 p-3 bg-emerald-500/10 rounded-xl"><DollarSign size={20}/></div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Faturamento Previsto</p>
            <h3 className="text-2xl font-black text-white">R$ {totalSaleValue.toLocaleString()}</h3>
          </div>
          <div className="text-purple-500 p-3 bg-purple-500/10 rounded-xl"><TrendingUp size={20}/></div>
        </div>
      </div>

      {/* TABELA ROLÁVEL */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar no estoque..."
              className="w-full bg-black/40 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-600 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-900/90 sticky top-0 text-zinc-500 text-[10px] uppercase font-bold tracking-widest z-10">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Estoque (Editável)</th>
                <th className="px-6 py-4">Custo Un.</th>
                <th className="px-6 py-4">Venda Un.</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`transition-all border-l-4 ${getRowStyle(item.stock, item.min_stock)}`}>
                  <td className="px-6 py-4 font-semibold">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="relative flex items-center w-24 group">
                      <input 
                        type="number"
                        value={item.stock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setItems(prev => prev.map(i => i.id === item.id ? { ...i, stock: val } : i));
                        }}
                        onBlur={(e) => updateStock(item.id, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm font-mono outline-none focus:border-blue-500 transition-all"
                      />
                      {updatingId === item.id && (
                        <Loader2 size={12} className="animate-spin absolute right-2 text-blue-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">R$ {item.cost_price?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white font-bold">R$ {item.price?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${
                      item.stock <= item.min_stock ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 
                      item.stock <= item.min_stock * 2 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && !loading && (
            <div className="p-20 text-center text-zinc-600 uppercase text-xs font-bold tracking-widest">
              Nenhum produto em estoque
            </div>
          )}
        </div>
      </div>
    </div>
  );
}