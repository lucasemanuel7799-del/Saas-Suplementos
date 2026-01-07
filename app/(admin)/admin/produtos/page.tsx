import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Força a página a recarregar dados sempre
export const revalidate = 0;

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-black p-8 text-zinc-100">
      
      {/* HEADER FIXO */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Produtos</h1>
          <p className="text-sm text-zinc-400">Gerencie seu catálogo ({products?.length || 0} itens)</p>
        </div>
        
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo Produto
        </Link>
      </div>

      {/* BARRA DE PESQUISA (Visual) */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar produto..." 
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* 
         === ÁREA DE LISTAGEM COM SCROLL === 
         max-h-[65vh]: Define a altura máxima (65% da altura da tela)
         overflow-y-auto: Ativa a rolagem apenas se passar dessa altura
      */}
      <div className="rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden">
        
        {/* Cabeçalho da Tabela (Fixo) */}
        <div className="grid grid-cols-12 gap-4 border-b border-zinc-800 bg-zinc-900/50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
          <div className="col-span-5">Produto</div>
          <div className="col-span-2">Categoria</div>
          <div className="col-span-2">Preço</div>
          <div className="col-span-2">Estoque</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {/* Corpo da Tabela (Rolável) */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
          
          {products && products.length > 0 ? (
            products.map((product) => (
              <div 
                key={product.id} 
                className="grid grid-cols-12 gap-4 items-center border-b border-zinc-800/50 px-6 py-4 transition-colors hover:bg-zinc-900/40 last:border-0"
              >
                {/* Produto (Imagem + Nome) */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-zinc-800 flex-shrink-0">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <Package size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white truncate pr-2">{product.name}</p>
                    {product.flavor && (
                       <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{product.flavor}</span>
                    )}
                  </div>
                </div>

                {/* Categoria */}
                <div className="col-span-2">
                  <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400">
                    {product.category || "Sem categoria"}
                  </span>
                </div>

                {/* Preço */}
                <div className="col-span-2">
                  <p className="font-medium text-zinc-200">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </p>
                </div>

                {/* Estoque (Fictício por enquanto, ou real se tiver a coluna) */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-zinc-400">{product.stock || 0} un</span>
                </div>

                {/* Ações */}
                <div className="col-span-1 flex justify-end gap-2">
                  <button className="rounded p-1.5 text-zinc-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                    <Edit size={16} />
                  </button>
                  {/* Botão de Excluir (Visual por enquanto) */}
                  <button className="rounded p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-zinc-500">
              <Package size={32} className="mb-2 opacity-50" />
              <p>Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}