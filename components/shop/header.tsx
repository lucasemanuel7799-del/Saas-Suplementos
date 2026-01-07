"use client";

import { useCart } from "@/contexts/cart-context";
import { useSearch } from "@/contexts/search-context";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
  const { totalItems } = useCart();
  const { isSearchOpen, toggleSearch, closeSearch } = useSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [storeName, setStoreName] = useState("Carregando..."); // Estado para o nome
  const router = useRouter();

  // 1. Buscar o nome da loja no banco ao carregar
  useEffect(() => {
    async function fetchStoreInfo() {
      // Pega a primeira loja encontrada (ou você pode filtrar por slug/id se tiver multiplas)
      const { data, error } = await supabase
        .from("stores")
        .select("name")
        .limit(1)
        .single();

      if (data?.name) {
        setStoreName(data.name);
      } else {
        setStoreName("Minha Loja"); // Fallback caso dê erro
      }
    }

    fetchStoreInfo();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/buscar?q=${searchTerm}`);
      closeSearch(); // Fecha a busca após pesquisar para limpar a tela
      setSearchTerm(""); // Limpa o campo
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          
          {/* LOGO DINÂMICA (Vinda do Banco) */}
          <Link href="/" className="text-xl font-bold tracking-tighter text-white truncate max-w-[200px]">
            {storeName}
          </Link>

          {/* Ações */}
          <div className="flex items-center gap-4">
            
            {/* Botão Busca */}
            <button 
              onClick={toggleSearch}
              className={`p-2 transition-colors ${isSearchOpen ? 'text-blue-500' : 'text-zinc-400 hover:text-white'}`}
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* Carrinho (Desktop) */}
            <Link href="/carrinho" className="relative hidden md:block text-zinc-400 hover:text-white">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Perfil (Desktop) */}
            <Link href="/perfil" className="hidden md:block text-zinc-400 hover:text-white">
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* ÁREA DE BUSCA (Aparece fora do header para garantir z-index) */}
      {isSearchOpen && (
        <div className="fixed left-0 right-0 top-16 z-30 border-b border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur-xl animate-in slide-in-from-top-2">
          <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </form>
          {/* Fundo escuro para clicar e fechar */}
          <div className="fixed inset-0 top-[60px] -z-10 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
        </div>
      )}
    </>
  );
}