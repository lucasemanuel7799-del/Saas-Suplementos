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
import { toast } from "sonner"; // Biblioteca de notificação

export default function InventoryPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Configuração: Abaixo de 5 unidades é considerado estoque baixo
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", user?.id)
      .order("stock", { ascending: true }); // Começa pelos que têm menos estoque

    if (data) setProducts(data);
    setLoading(false);
  }

  async function updateStock(id: string, newStock: number) {
    if (newStock < 0) return; // Impede estoque negativo
    
    setUpdatingId(id);

    // 1. Guardar estado anterior (para rollback se der erro)
    const oldProducts = [...products];

    // 2. Atualização Otimista (Visual imediato)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

    // 3. Atualização no Banco de Dados
    const { error } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar estoque. Tente novamente.");
      setProducts(oldProducts); // Reverte visualmente
    } 
    
    setUpdatingId(null);
  }

  // --- Cálculos de KPIs (Topo da Página) ---
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  // --- Filtro de Busca ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* CABEÇALHO */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">Controle de Estoque</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie a quantidade e a disponibilidade dos seus produtos.</p>
      </div>

      {/* CARDS DE RESUMO (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Card Valor Total */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <DollarSign size={16} className="text-emerald-500"/>
                <span className="text-xs font-bold uppercase">Valor em Estoque</span>
            </div>
            <p className="text-2xl font-bold text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Card Total Itens */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Package size={16} className="text-blue-500"/>
                <span className="text-xs font-bold uppercase">Total de Itens</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalItems} <span className="text-sm text-zinc-500 font-normal">unidades</span></p>
        </div>

        {/* Card Estoque Baixo */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${lowStockCount > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <AlertTriangle size={16} className={lowStockCount > 0 ? "text-orange-500" : "text-zinc-500"}/>
                <span className={`text-xs font-bold uppercase ${lowStockCount > 0 ? "text-orange-400" : ""}`}>Estoque Baixo</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-orange-500" : "text-white"}`}>{lowStockCount} <span className="text-sm text-zinc-500 font-normal">produtos</span></p>
        </div>

        {/* Card Esgotado */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${outOfStockCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <XCircle size={16} className={outOfStockCount > 0 ? "text-red-500" : "text-zinc-500"}/>
                <span className={`text-xs font-bold uppercase ${outOfStockCount > 0 ? "text-red-400" : ""}`}>Esgotados</span>
            </div>
            <p className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-red-500" : "text-white"}`}>{outOfStockCount} <span className="text-sm text-zinc-500 font-normal">produtos</span></p>
        </div>

      </div>

      {/* BARRA DE BUSCA */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto..." 
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
        </div>
      </div>

      {/* TABELA COM SCROLL */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col flex-1 min-h-0">
        
        {/* Container de Rolagem:
            - overflow-auto: Permite rolar
            - max-h-[600px]: Limita altura (ajuste conforme necessário)
        */}
        <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          
          <table className="w-full text-left text-sm">
            
            {/* Cabeçalho Fixo (Sticky) */}
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase font-medium text-xs shadow-md shadow-black/40">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Produto</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider text-center">Ajuste Rápido</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Valor em Estoque</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                 <tr>
                    <td colSpan={4} className="text-center py-20 text-zinc-500">Carregando estoque...</td>
                 </tr>
              ) : filteredProducts.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="text-center py-20 text-zinc-500">Nenhum produto encontrado.</td>
                 </tr>
              ) : (
                filteredProducts.map((product) => {
                  
                  // Lógica de Cores
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
                      
                      {/* Produto e ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-cover h-full w-full"/>
                            ) : (
                                <Package size={16} className="text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{product.name}</p>
                            {/* Correção do .slice() */}
                            <p className="text-xs text-zinc-500">Ref: {String(product.id).slice(0, 6)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${statusColor}`}>
                            {product.stock === 0 && <XCircle size={12} />}
                            {product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD && <AlertTriangle size={12} />}
                            {product.stock > LOW_STOCK_THRESHOLD && <CheckCircle2 size={12} />}
                            {statusText}
                        </span>
                      </td>

                      {/* Botões +/- */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                            <button 
                                onClick={() => updateStock(product.id, product.stock - 1)}
                                disabled={product.stock <= 0 || updatingId === product.id}
                                className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-red-500 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Minus size={14} />
                            </button>
                            
                            <div className="w-12 text-center font-mono font-bold text-white text-lg relative">
                                {updatingId === product.id ? (
                                    <Loader2 className="animate-spin mx-auto text-orange-500" size={18} />
                                ) : (
                                    product.stock
                                )}
                            </div>

                            <button 
                                onClick={() => updateStock(product.id, product.stock + 1)}
                                disabled={updatingId === product.id}
                                className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-500 flex items-center justify-center transition-all disabled:opacity-30"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                      </td>

                      {/* Valor Monetário */}
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