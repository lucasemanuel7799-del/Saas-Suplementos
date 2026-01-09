"use client";

import { Store, Clock } from "lucide-react";

interface ShopHeaderProps {
  name: string;
  logoUrl?: string | null;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  headerColor: string;
}

export default function ShopHeader({ 
  name, logoUrl, isOpen, opensAt, closesAt, headerColor 
}: ShopHeaderProps) {
  
  return (
    <div 
      className="border-b border-black/5 shadow-sm sticky top-0 z-50 transition-colors duration-500"
      style={{ backgroundColor: headerColor }}
    >
      {/* CÁLCULO DE ALTURA (Para alinhar com a Navbar):
         Mobile: Logo (h-14 = 56px) + Padding (py-6 = 48px) + Borda (1px) = 105px
         Desktop: Logo (h-20 = 80px) + Padding (py-8 = 64px) + Borda (1px) = 145px
      */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Logo: Mobile (h-14) / Desktop (h-20) */}
          <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Store style={{ color: headerColor }} className="w-6 h-6 md:w-8 md:h-8" />
            )}
          </div>

          <div className="flex-1 text-white">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight leading-none text-white drop-shadow-sm line-clamp-1">
              {name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {isOpen ? (
                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-emerald-500/30 backdrop-blur-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] md:text-[11px] font-semibold text-emerald-50 tracking-wide">Aberta</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-[10px] md:text-[11px] font-semibold text-white/80 tracking-wide">Fechada</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-white/80 text-[10px] md:text-xs font-medium bg-black/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">
                <Clock size={12} />
                <span>{opensAt} - {closesAt}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}