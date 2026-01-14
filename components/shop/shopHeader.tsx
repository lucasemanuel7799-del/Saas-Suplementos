"use client";

import { Store, Clock, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // Adicionei Link para poder voltar

// Lógica para saber se está aberto
function isStoreOpen(opensAt: string, closesAt: string, openDays: number[]) {
  if (!opensAt || !closesAt) return false;
  
  const now = new Date();
  const currentDay = now.getDay(); 
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = opensAt.split(":").map(Number);
  const [closeH, closeM] = closesAt.split(":").map(Number);
  
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (!openDays.includes(currentDay)) return false;
  return currentTime >= openTime && currentTime < closeTime;
}

// Interface agora recebe a STORE completa do banco
interface ShopHeaderProps {
  store: any; // Se tiver tipagem do Supabase, use aqui
}

export function ShopHeader({ store }: ShopHeaderProps) {
  // Calculamos os dados baseados na store
  const isOpen = isStoreOpen(store.opens_at, store.closes_at, store.open_days || [0,1,2,3,4,5,6]);
  const headerColor = store.primary_color || "#18181b"; // Usa a cor do banco

  return (
    <header 
      className="sticky top-0 z-50 w-full shadow-sm transition-colors"
      style={{ backgroundColor: headerColor }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* LADO ESQUERDO: LOGO E NOME */}
        <div className="flex items-center gap-3">
          <Link href={`/${store.slug}`}>
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <Store className="text-white" size={24} />
              )}
            </div>
          </Link>
          
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-lg leading-tight line-clamp-1">
              {store.name}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-white/80 text-[10px] font-medium uppercase tracking-wider">
                {isOpen ? 'Aberta agora' : 'Fechada'}
              </span>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: HORÁRIOS (Desktop) */}
        <div className="hidden md:flex items-center gap-4 text-white/90">
          <div className="flex items-center gap-2 text-xs border-l border-white/20 pl-4">
            <Clock size={14} />
            <span>{store.opens_at} - {store.closes_at}</span>
          </div>
        </div>

        {/* BOTÃO INFO (Mobile) */}
        <button className="md:hidden text-white/80 p-2">
          <Info size={20} />
        </button>
      </div>
    </header>
  );
}