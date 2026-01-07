"use client";

import { ProductCard } from "@/components/shop/product-card";
import { supabase } from "@/lib/supabase";
import { Loader2, SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Componente interno que usa useSearchParams
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q"); // Pega o termo da URL
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Busca no Supabase: Nome OU Categoria parecidos com o termo
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro na busca:", error);
      } else {
        setProducts(data || []);
      }
      
      setLoading(false);
    }

    fetchProducts();
  }, [query]);

  // 1. Estado de Carregamento
  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin mr-2" /> Buscando...
      </div>
    );
  }

  // 2. Estado Sem Resultados
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
        <SearchX size={48} className="mb-4 opacity-50" />
        <h2 className="text-lg font-bold text-zinc-300">O que você procura?</h2>
        <p className="text-sm">Digite o nome do produto ou categoria na barra acima.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
        <SearchX size={48} className="mb-4 opacity-50" />
        <h2 className="text-lg font-bold text-zinc-300">Nenhum resultado encontrado</h2>
        <p className="text-sm">Não encontramos nada para "{query}".</p>
        <p className="text-xs mt-2">Tente termos mais genéricos como "Whey", "Creatina"...</p>
      </div>
    );
  }

  // 3. Exibição dos Resultados
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span>Resultados para:</span>
        <span className="font-bold text-white">"{query}"</span>
        <span className="ml-auto text-xs bg-zinc-900 px-2 py-1 rounded-full">{products.length} itens</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// Página Principal (Envelope para Suspense)
export default function SearchPage() {
  return (
    <div className="min-h-screen pb-32 pt-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Busca</h1>
      
      {/* 
         O Next.js exige Suspense ao usar useSearchParams em Client Components 
         para evitar erros de build.
      */}
      <Suspense fallback={<div className="text-zinc-500">Carregando busca...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}