"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Search, 
  AlertTriangle, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Minus, 
  Plus, 
  Loader2,
  DollarSign
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function InventoryPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. PRIMEIRO: Busca o ID da loja vinculada ao dono
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (store) {
      // 2. SEGUNDO: Busca os produtos que pertencem a ESSA loja (UUID)
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("stock", { ascending: true });

      if (data) setProducts(data);
    }
    
    setLoading(false);
  }

  async function updateStock(id: string, newStock: number) {
    if (newStock < 0) return;
    
    setUpdatingId(id);
    const oldProducts = [...products];

    // Atualização Otimista
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar estoque.");
      setProducts(oldProducts);
    } 
    
    setUpdatingId(null);
  }

  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">Controle de Estoque</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie a quantidade e a disponibilidade dos seus produtos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <DollarSign size={16} className="text-emerald-500"/>
                <span className="text-xs font-bold uppercase text-[10px]">Valor em Estoque</span>
            </div>
            <p className="text-2xl font-bold text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Package size={16} className="text-blue-500"/>
                <span className="text-xs font-bold uppercase text-[10px]">Total de Itens</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalItems} <span className="text-sm text-zinc-500 font-normal">un</span></p>
        </div>

        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${lowStockCount > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <AlertTriangle size={16} className={lowStockCount > 0 ? "text-orange-500" : "text-zinc-500"}/>
                <span className={`text-xs font-bold uppercase text-[10px] ${lowStockCount > 0 ? "text-orange-400" : ""}`}>Estoque Baixo</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-500" : "text-white"}`}>{lowStockCount}</p>
        </div>

        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${outOfStockCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <XCircle size={16} className={outOfStockCount > 0 ? "text-red-500" : "text-zinc-500"}/>
                <span className={`text-xs font-bold uppercase text-[10px] ${outOfStockCount > 0 ? "text-red-400" : ""}`}>Esgotados</span>
            </div>
            <p className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-red-500" : "text-white"}`}>{outOfStockCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto..." 
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-orange-500 outline-none transition-all"
            />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col flex-1 min-h-0">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase font-medium text-xs border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Produto</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Ajuste Rápido</th>
                <th className="px-6 py-4 font-bold text-right">Valor em Estoque</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                 <tr><td colSpan={4} className="text-center py-20 text-zinc-500">Carregando estoque...</td></tr>
              ) : filteredProducts.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-20 text-zinc-500">Nenhum produto encontrado.</td></tr>
              ) : (
                filteredProducts.map((product) => {
                  let statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                  let statusText = "Em Estoque";
                  let rowBorder = "hover:bg-zinc-800/30";

                  if (product.stock === 0) {
                      statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
                      statusText = "Esgotado";
                      rowBorder = "bg-red-500/5 hover:bg-red-500/10";
                  } else if (product.stock <= LOW_STOCK_THRESHOLD) {
                      statusColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
                      statusText = "Baixo Estoque";
                      rowBorder = "bg-orange-500/5 hover:bg-orange-500/10";
                  }

                  return (
                    <tr key={product.id} className={`group transition-colors ${rowBorder}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} fill className="object-cover"/>
                            ) : (
                                <Package size={16} className="text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{product.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">ID: {String(product.id).slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${statusColor}`}>
                            {statusText}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                            <button 
                                onClick={() => updateStock(product.id, product.stock - 1)}
                                disabled={product.stock <= 0 || updatingId === product.id}
                                className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-red-500 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-30"
                            >
                                <Minus size={14} />
                            </button>
                            
                            <div className="w-10 text-center font-mono font-bold text-white">
                                {updatingId === product.id ? (
                                    <Loader2 className="animate-spin mx-auto text-orange-500" size={14} />
                                ) : (
                                    product.stock
                                )}
                            </div>

                            <button 
                                onClick={() => updateStock(product.id, product.stock + 1)}
                                disabled={updatingId === product.id}
                                className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center transition-all disabled:opacity-30"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-zinc-300">
                        R$ {(product.price * product.stock).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}