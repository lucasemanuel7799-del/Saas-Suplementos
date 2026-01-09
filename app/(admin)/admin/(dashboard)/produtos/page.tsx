"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Plus, Search, Package, Edit, Trash2, 
  ScanBarcode, Image as ImageIcon, 
  PackagePlus, TrendingUp, Tag
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    
    // Otimista
    setProducts(prev => prev.filter(p => p.id !== id));
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
        toast.error("Erro ao excluir.");
        fetchProducts(); // Reverte se der erro
    } else {
        toast.success("Item excluído.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      {/* HEADER */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Produtos & Kits</h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie seu catálogo, estoque e precificação.</p>
        </div>
        
        <div className="flex gap-3">
            {/* Botão Novo Kit */}
            <Link 
                href="/admin/produtos/novo-kit"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold border border-zinc-700 transition-all active:scale-95"
            >
                <PackagePlus size={18} className="text-purple-400"/> Novo Kit
            </Link>
            
            {/* Botão Novo Produto */}
            <Link 
                href="/admin/produtos/novo"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95"
            >
                <Plus size={18} /> Novo Produto
            </Link>
        </div>
      </div>

      {/* BUSCA */}
      <div className="shrink-0 relative max-w-md">
         <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
         <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou código de barras..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-orange-500 outline-none transition-all"
         />
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col flex-1 min-h-0">
        <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase font-medium text-xs shadow-md">
              <tr>
                <th className="px-6 py-4 font-bold">Item</th>
                <th className="px-6 py-4 font-bold text-center">Categoria</th>
                <th className="px-6 py-4 font-bold text-center">Estoque</th>
                <th className="px-6 py-4 font-bold text-right">Custo / Venda</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                  <tr><td colSpan={5} className="text-center py-20 text-zinc-500">Carregando catálogo...</td></tr>
              ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-20 text-zinc-500">Nenhum item encontrado.</td></tr>
              ) : (
               filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-800/30 group transition-colors">
                    
                    {/* COLUNA 1: NOME + IMAGEM + BARCODE */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                            {product.image_url ? (
                                <Image src={product.image_url} alt={product.name} fill className="object-cover"/>
                            ) : (
                                product.is_kit ? <PackagePlus size={20} className="text-purple-500" /> : <Package size={20} className="text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-sm">{product.name}</p>
                                {product.is_kit && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">KIT</span>
                                )}
                            </div>
                            
                            {/* Barcode e Detalhes */}
                            <div className="flex items-center gap-2 mt-0.5">
                                {product.barcode && (
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                        <ScanBarcode size={10} />
                                        <span className="font-mono">{product.barcode}</span>
                                    </div>
                                )}
                                {product.volume && <span className="text-[10px] text-zinc-500">• {product.volume}</span>}
                            </div>
                          </div>
                        </div>
                    </td>

                    {/* COLUNA 2: CATEGORIA */}
                    <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs truncate max-w-[120px]">
                            {product.category || "-"}
                        </span>
                    </td>

                    {/* COLUNA 3: ESTOQUE */}
                    <td className="px-6 py-4 text-center">
                        <span className={`font-mono font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-zinc-300'}`}>
                            {product.stock}
                        </span>
                    </td>

                    {/* COLUNA 4: PREÇOS */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-400">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                            {product.cost_price > 0 && (
                                <span className="text-[10px] text-zinc-600">Custo: R$ {product.cost_price.toFixed(2)}</span>
                            )}
                        </div>
                    </td>

                    {/* COLUNA 5: AÇÕES */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Aqui você poderia colocar o Link para editar */}
                            <button className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
               )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}