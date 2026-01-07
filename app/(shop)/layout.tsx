import { CartProvider } from "@/contexts/cart-context";
import { SearchProvider } from "@/contexts/search-context"; // <--- Importe aqui
import { BottomNav } from "@/components/shop/bottom-nav";
import { Header } from "@/components/shop/header";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <SearchProvider> {/* <--- Adicione aqui */}
        <div className="min-h-screen bg-black text-zinc-100 pb-20 md:pb-0">
          <Header />
          <main className="mx-auto max-w-7xl p-4">
            {children}
          </main>
          <BottomNav />
        </div>
      </SearchProvider>
    </CartProvider>
  );
}