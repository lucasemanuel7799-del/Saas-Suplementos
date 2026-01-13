"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Plus, Search, Package, Edit, Trash2, 
  ScanBarcode, PackagePlus, AlertTriangle, X, Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  stock: number;
  category?: string;
  image_url?: string;
  barcode?: string;
  volume?: string;
  is_kit?: boolean;
  store_id: string;
}

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ESTADO PARA O MODAL DE EXCLUSÃO
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar produtos.");
    }

    if (data) setProducts(data);
    setLoading(false);
  }

  // Função que realmente apaga (chamada pelo Modal)
  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
        const { error } = await supabase.from("products").delete().eq("id", productToDelete);
        
        if (error) throw error;

        // Atualiza a lista localmente
        setProducts(prev => prev.filter(p => p.id !== productToDelete));
        toast.success("Produto excluído com sucesso.");
        setProductToDelete(null); // Fecha o modal
    } catch (error) {
        toast.error("Erro ao excluir. Tente novamente.");
    } finally {
        setIsDeleting(false);
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
            <Link 
                href="/admin/produtos/novo-kit"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold border border-zinc-700 transition-all active:scale-95"
            >
                <PackagePlus size={18} className="text-purple-400"/> Novo Kit
            </Link>
            
            <Link 
                href="/admin/produtos/novo"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
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
           className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600"
         />
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-sm flex flex-col flex-1 min-h-0">
        <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-950 text-zinc-500 uppercase font-medium text-xs shadow-md border-b border-zinc-800">
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
                        <span className={`font-mono font-bold px-2 py-1 rounded ${product.stock <= 5 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'text-zinc-300'}`}>
                            {product.stock}
                        </span>
                    </td>

                    {/* COLUNA 4: PREÇOS */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-400">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                            {(product.cost_price || 0) > 0 && (
                                <span className="text-[10px] text-zinc-500">Custo: R$ {product.cost_price.toFixed(2).replace('.',',')}</span>
                            )}
                        </div>
                    </td>

                    {/* COLUNA 5: AÇÕES */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/produtos/editar/${product.id}`}>
                                <button className="p-2 bg-zinc-900 hover:bg-blue-600/10 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors border border-transparent hover:border-blue-500/20">
                                    <Edit size={16} />
                                </button>
                            </Link>
                            {/* BOTÃO QUE ABRE O MODAL */}
                            <button 
                                onClick={() => setProductToDelete(product.id)} 
                                className="p-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                            >
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

      {/* --- MODAL DE CONFIRMAÇÃO (CUSTOMIZADO) --- */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95">
                
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        <AlertTriangle size={24} />
                    </div>
                    
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Excluir Produto?</h3>
                        <p className="text-sm text-zinc-400">
                            Esta ação é irreversível. O produto será removido do estoque e das listagens.
                        </p>
                    </div>

                    <div className="flex gap-3 w-full mt-4">
                        <button 
                            onClick={() => setProductToDelete(null)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="animate-spin" size={16}/> : "Sim, Excluir"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}