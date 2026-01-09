"use client";

import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Definimos quais páginas NÃO devem mostrar a barra de navegação
  const hideNavbarPaths = ["/login", "/register"];
  const shouldHideNavbar = hideNavbarPaths.includes(pathname);

  return (
    <div className="min-h-screen bg-white">
      {/* O conteúdo da página (Login, Register ou a Loja) */}
      <main>{children}</main>

      {/* RENDERIZAÇÃO CONDICIONAL: Só mostra se NÃO for login/register */}
      {!shouldHideNavbar && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 flex justify-between items-center z-50">
          <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-red-500' : 'text-zinc-400'}`}>
            <Home size={20} />
            <span className="text-[10px] font-bold">Início</span>
          </Link>
          <Link href="/buscar" className={`flex flex-col items-center gap-1 ${pathname === '/buscar' ? 'text-red-500' : 'text-zinc-400'}`}>
            <Search size={20} />
            <span className="text-[10px] font-bold">Busca</span>
          </Link>
          <Link href="/carrinho" className={`flex flex-col items-center gap-1 ${pathname === '/carrinho' ? 'text-red-500' : 'text-zinc-400'}`}>
            <ShoppingBag size={20} />
            <span className="text-[10px] font-bold">Sacola</span>
          </Link>
          <Link href="/perfil" className={`flex flex-col items-center gap-1 ${pathname === '/perfil' ? 'text-red-500' : 'text-zinc-400'}`}>
            <User size={20} />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        </nav>
      )}
    </div>
  );
}