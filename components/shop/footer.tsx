"use client";

import { MapPin, Phone } from "lucide-react";

export function StoreFooter({ store }: { store: any }) {
  return (
    <footer className="bg-white border-t border-zinc-100 py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
        
        {/* Nome e Endereço */}
        <div>
          <h3 className="font-bold text-zinc-900">{store.name}</h3>
          {(store.street || store.city) && (
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-1">
              <MapPin size={12} /> 
              {store.street}, {store.number} - {store.neighborhood}, {store.city}
            </p>
          )}
        </div>

        {/* Botão de Contato */}
        {store.phone && (
          <a 
            href={`https://wa.me/55${store.phone.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-zinc-600 text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            <Phone size={14} /> Falar no WhatsApp
          </a>
        )}

        <div className="pt-4 border-t border-zinc-50">
           <p className="text-[10px] text-zinc-400">
             Desenvolvido com tecnologia MinhaPlataforma
           </p>
        </div>
      </div>
    </footer>
  );
}