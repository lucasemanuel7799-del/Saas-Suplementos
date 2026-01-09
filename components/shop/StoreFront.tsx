"use client";

import { useState } from "react";
import ShopHeader from "@/components/shop/shopHeader";
import { Package, Plus, Search, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  stock: number;
  category?: string;
}

interface StoreData {
  name: string;
  logo_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  opens_at?: string;
  closes_at?: string;
}

interface StoreFrontProps {
  store: StoreData;
  products: Product[];
  isOpen: boolean;
}

export default function StoreFront({ store, products, isOpen }: StoreFrontProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const allCategories = Array.from(new Set(products.map((p) => p.category || "Geral"))).sort();
  const categoriesForNav = ["Todos", ...allCategories];

  const primaryColor = store.primary_color || "#f4f4f5";
  const secondaryColor = store.secondary_color || "#18181b";

  // Título da Categoria
  const CategoryTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-6 mt-10 px-1">
      <div className="bg-white border border-zinc-200 px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
          <h2 className="text-base md:text-lg font-bold text-zinc-900 tracking-tight">
            {title}
          </h2>
          <span className="bg-zinc-100 text-zinc-500 text-xs px-1.5 py-0.5 rounded-md font-medium">
            {products.filter(p => (p.category || "Geral") === title).length}
          </span>
      </div>
      <div className="h-px flex-1 bg-black/5"></div>
    </div>
  );

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex gap-4 group relative overflow-hidden">
      <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-50 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-zinc-100 relative">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package size={24} className="text-zinc-300" />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-2 font-medium">
             {product.stock > 0 ? `${product.stock} disponíveis` : 'Esgotado'}
          </p>
        </div>

        <div className="flex justify-between items-end mt-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-medium uppercase">Preço</span>
            <span style={{ color: secondaryColor }} className="font-bold text-lg leading-none">
              R$ {Number(product.price).toFixed(2)}
            </span>
          </div>
          
          <button 
            disabled={!isOpen}
            style={{ 
              backgroundColor: isOpen ? 'white' : '#f4f4f5',
              borderColor: isOpen ? secondaryColor : 'transparent',
              color: isOpen ? secondaryColor : '#a1a1aa'
            }}
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95 hover:bg-zinc-50"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen pb-32 transition-colors duration-500 font-sans"
      style={{ backgroundColor: primaryColor }}
    >
      <ShopHeader 
        name={store.name} 
        logoUrl={store.logo_url}
        isOpen={isOpen}
        opensAt={store.opens_at || "08:00"}
        closesAt={store.closes_at || "22:00"}
        headerColor={secondaryColor} 
      />

      {!isOpen && (
        <div className="bg-zinc-800 text-white p-3 text-center text-xs font-medium tracking-wide">
          A loja está fechada no momento.
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 md:px-6">
        
        {/* BUSCA */}
        <div className="relative mb-6 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar produtos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // CORREÇÃO ZOOM: text-base (16px) impede zoom no iOS
            // CORREÇÃO LUPA: pl-12 (48px) afasta o texto da lupa
            className="w-full bg-white border border-zinc-200 rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all text-base text-zinc-800 shadow-sm focus:border-zinc-400 focus:shadow-md placeholder:text-zinc-400 appearance-none"
          />
        </div>

        {/* NAVBAR SINCRONIZADA */}
        <div 
          // CORREÇÃO DE POSIÇÃO:
          // top-[105px] para Mobile
          // md:top-[145px] para Desktop
          className="sticky top-[105px] md:top-[145px] z-40 py-3 -mx-4 px-4 md:mx-0 md:px-0 transition-all bg-white/95 backdrop-blur-sm border-b border-zinc-100 mb-6 shadow-sm" 
        >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-5xl mx-auto">
            {categoriesForNav.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ 
                    backgroundColor: isActive ? secondaryColor : '#f4f4f5', 
                    color: isActive ? 'white' : '#52525b',
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 hover:opacity-90 border border-transparent"
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTA */}
        <div className="space-y-2 min-h-[50vh]">
          {selectedCategory === "Todos" ? (
            allCategories.map((categoryName) => {
              const categoryProducts = products.filter(p => 
                (p.category || "Geral") === categoryName && 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (categoryProducts.length === 0) return null;

              return (
                <section key={categoryName} id={`cat-${categoryName}`} className="scroll-mt-48 mb-8">
                  <CategoryTitle title={categoryName} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <section className="animate-in fade-in duration-300">
              <CategoryTitle title={selectedCategory} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter(p => (p.category || "Geral") === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
              {products.filter(p => (p.category || "Geral") === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                 <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-2 opacity-50"/>
                    <p className="text-sm font-medium">Nenhum produto encontrado.</p>
                 </div>
              )}
            </section>
          )}
        </div>

      </main>
    </div>
  );
}