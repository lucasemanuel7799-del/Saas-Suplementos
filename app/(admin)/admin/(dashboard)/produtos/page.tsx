"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Plus, Search, Package, Edit, Trash2, Loader2, Scale, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  brand: string | null;
  flavor: string | null;
  weight: number | null;
  weight_unit: string | null;
}

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();

    // --- REALTIME PRODUCTS ---
    const channel = supabase
      .channel('realtime-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new as Product, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new as Product } : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Erro ao excluir.");
    // O Realtime cuida de remover da lista!
  }

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-zinc-400 text-sm">Gerencie o catálogo da sua loja.</p>
        </div>
        <Link href="/admin/produtos/novo" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 shadow-lg shadow-blue-900/20">
          <Plus size={18} /> Novo Produto
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nome, marca ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <div className="bg-zinc-800 p-4 rounded-full mb-4"><Package size={40} className="text-zinc-500" /></div>
          <h3 className="text-lg font-medium text-white">Nenhum produto encontrado</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-xs text-center">Cadastre novos itens ou tente buscar por outro termo.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-black/40 text-xs uppercase font-bold text-zinc-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Estoque</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-black border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <Package size={20} className="text-zinc-700" />}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-100 line-clamp-1">{product.name}</div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          {product.brand && <span className="text-blue-400 font-medium">{product.brand}</span>}
                          {product.flavor && <><span className="w-1 h-1 rounded-full bg-zinc-600"></span><span className="text-zinc-500">{product.flavor}</span></>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{(product.weight && product.weight > 0) ? <div className="flex items-center gap-1.5 text-zinc-300 bg-zinc-800/50 px-2 py-1 rounded-md w-fit text-xs font-medium border border-zinc-800"><Scale size={12} className="text-zinc-500" />{product.weight} {product.weight_unit}</div> : <span className="text-zinc-600 text-xs">-</span>}</td>
                  <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300"><Tag size={10} className="text-zinc-500" />{product.category || "Geral"}</span></td>
                  <td className="px-6 py-4 text-zinc-100 font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-bold ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}</span>
                      <div className="h-1 w-16 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(product.stock, 100)}%` }} /></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/produtos/editar/${product.id}`} className="p-2 hover:bg-blue-500/10 hover:border-blue-500/50 border border-transparent rounded-lg text-zinc-400 hover:text-blue-400 transition-all" title="Editar"><Edit size={16} /></Link>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/10 hover:border-red-500/50 border border-transparent rounded-lg text-zinc-400 hover:text-red-500 transition-all" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}