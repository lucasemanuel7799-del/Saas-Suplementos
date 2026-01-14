"use client";

import { Home, ShoppingBag, User, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ store }: { store: any }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const baseUrl = `/${store.slug}`;

  // Cores dinâmicas
  const activeColor = store.primary_color || "#000";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 pb-5 md:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex items-center justify-between max-w-md mx-auto md:max-w-4xl">
        
        <Link href={`${baseUrl}`} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
          <Home 
            size={20} 
            color={isActive(`${baseUrl}`) ? activeColor : "#a1a1aa"}
            strokeWidth={isActive(`${baseUrl}`) ? 2.5 : 2}
          />
          <span style={{ color: isActive(`${baseUrl}`) ? activeColor : "#a1a1aa" }} className="text-[9px] font-bold">Início</span>
        </Link>

        {/* PRODUTOS */}
        <Link href={`${baseUrl}/produtos`} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
          <FileText 
            size={20} 
            color={isActive(`${baseUrl}/produtos`) ? activeColor : "#a1a1aa"}
            strokeWidth={isActive(`${baseUrl}/produtos`) ? 2.5 : 2}
          />
          <span style={{ color: isActive(`${baseUrl}/produtos`) ? activeColor : "#a1a1aa" }} className="text-[9px] font-bold">Cardápio</span>
        </Link>

        {/* CARRINHO */}
        <Link href={`${baseUrl}/carrinho`} className="relative -top-5">
           <div 
             className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg border-4 border-zinc-50"
             style={{ backgroundColor: activeColor }}
           >
              <ShoppingBag size={24} />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">0</span>
           </div>
        </Link>

        {/* PEDIDOS */}
        <Link href={`${baseUrl}/pedidos`} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
          <FileText 
            size={20} 
            color={isActive(`${baseUrl}/pedidos`) ? activeColor : "#a1a1aa"}
            strokeWidth={isActive(`${baseUrl}/pedidos`) ? 2.5 : 2}
          />
          <span style={{ color: isActive(`${baseUrl}/pedidos`) ? activeColor : "#a1a1aa" }} className="text-[9px] font-bold">Pedidos</span>
        </Link>

        {/* PERFIL */}
        <Link href={`${baseUrl}/perfil`} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
          <User 
            size={20} 
            color={isActive(`${baseUrl}/perfil`) ? activeColor : "#a1a1aa"}
            strokeWidth={isActive(`${baseUrl}/perfil`) ? 2.5 : 2}
          />
          <span style={{ color: isActive(`${baseUrl}/perfil`) ? activeColor : "#a1a1aa" }} className="text-[9px] font-bold">Perfil</span>
        </Link>

      </div>
    </div>
  );
}