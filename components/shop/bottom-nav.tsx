"use client";

import { useCart } from "@/contexts/cart-context";
import { useSearch } from "@/contexts/search-context"; // Importe o contexto
import { Home, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { isSearchOpen, toggleSearch } = useSearch(); // Usa o controle

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black/90 px-6 py-3 backdrop-blur-lg md:hidden safe-area-bottom">
      <nav className="flex items-center justify-between">
        
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 ${
            pathname === "/" ? "text-blue-500" : "text-zinc-500"
          }`}
        >
          <Home size={22} />
          <span className="text-[10px]">Início</span>
        </Link>

        {/* Botão de Busca: Agora é um BUTTON que ativa o Toggle */}
        <button
          onClick={toggleSearch}
          className={`flex flex-col items-center gap-1 ${
            isSearchOpen ? "text-blue-500" : "text-zinc-500"
          }`}
        >
          <Search size={22} />
          <span className="text-[10px]">Buscar</span>
        </button>

        <Link
          href="/carrinho"
          className={`relative flex flex-col items-center gap-1 ${
            pathname === "/carrinho" ? "text-blue-500" : "text-zinc-500"
          }`}
        >
          <div className="relative">
            <ShoppingBag size={22} />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cesta</span>
        </Link>

        <Link
          href="/perfil"
          className={`flex flex-col items-center gap-1 ${
            pathname === "/perfil" ? "text-blue-500" : "text-zinc-500"
          }`}
        >
          <User size={22} />
          <span className="text-[10px]">Perfil</span>
        </Link>
      </nav>
    </div>
  );
}