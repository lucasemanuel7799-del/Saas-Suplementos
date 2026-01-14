"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/contexts/cart-context";
import { ShopHeader } from "@/components/shop/shopHeader";
import { BottomNav } from "@/components/shop/bottom-nav";
import { Toaster } from "sonner";

interface ShopWrapperProps {
  children: ReactNode;
  store: any; // Seus dados da loja
}

export function ShopWrapper({ children, store }: ShopWrapperProps) {
  // Define as variáveis CSS de cor aqui, no cliente, para garantir
  const dynamicStyle = {
    "--primary": store.primary_color || "#18181b",    
    "--secondary": store.secondary_color || "#dc2626", 
  } as React.CSSProperties;

  return (
    <CartProvider>
      <div 
        className="min-h-screen bg-zinc-50 flex flex-col"
        style={dynamicStyle}
      >
        {/* Header dentro do Provider */}
        <ShopHeader store={store} />

        {/* Conteúdo (Sua página) dentro do Provider */}
        <main className="flex-1 w-full max-w-md mx-auto md:max-w-4xl p-4 pb-24">
          {children}
        </main>

        {/* Nav dentro do Provider */}
        <BottomNav store={store} />

        <Toaster position="top-center" richColors />
      </div>
    </CartProvider>
  );
}