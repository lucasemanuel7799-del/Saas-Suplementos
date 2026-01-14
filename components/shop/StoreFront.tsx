"use client";

import { useState } from "react";
import { Package, Plus, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  stock: number;
  category?: string;
}

interface StoreData {
  name: string;
  primary_color?: string;
  secondary_color?: string;
}

interface StoreFrontProps {
  store: StoreData;
  products: Product[];
  isOpen: boolean;
}

export function StoreFront({ store, products, isOpen }: StoreFrontProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const { addToCart } = useCart(); // Funciona pois está dentro do Wrapper do Layout

  const allCategories = Array.from(new Set(products.map((p) => p.category || "Geral"))).sort();
  const categoriesForNav = ["Todos", ...allCategories];
  const secondaryColor = store.secondary_color || "#18181b";

  const handleAddToCart = (product: Product) => {
    if (!isOpen) {
      toast.error("Loja fechada.");
      return;
    }
    addToCart(product);
    toast.success("Adicionado ao carrinho!");
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex gap-4 relative overflow-hidden group">
      <div className="w-24 h-24 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100 shrink-0 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package size={24} className="text-zinc-300" />
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div>
          <h3 className="font-semibold text-zinc-900 text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-zinc-500">{product.stock > 0 ? `${product.stock} un.` : "Esgotado"}</p>
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Preço</span>
            <span style={{ color: secondaryColor }} className="font-bold text-lg">R$ {Number(product.price).toFixed(2)}</span>
          </div>
          <button
            onClick={() => handleAddToCart(product)}
            disabled={!isOpen || product.stock <= 0}
            style={{ backgroundColor: isOpen && product.stock > 0 ? "white" : "#f4f4f5", borderColor: secondaryColor, color: secondaryColor }}
            className="w-10 h-10 rounded-lg border flex items-center justify-center active:scale-90 transition-all border-current"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans min-h-[60vh]">
      {!isOpen && (
        <div className="bg-zinc-800 text-white p-3 text-center text-xs font-bold rounded-lg mb-4 sticky top-4 z-30 shadow-md">
          Loja Fechada. Apenas visualização.
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" placeholder="Buscar..." 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-zinc-400"
        />
      </div>

      {/* Categorias */}
      <div className="sticky top-[80px] z-20 bg-zinc-50/95 backdrop-blur py-2 -mx-4 px-4 md:mx-0 md:px-0 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categoriesForNav.map((cat) => (
            <button 
              key={cat} onClick={() => setSelectedCategory(cat)}
              style={{ backgroundColor: selectedCategory === cat ? secondaryColor : "#fff", color: selectedCategory === cat ? "#fff" : "#52525b" }}
              className="px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border border-zinc-200"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
        {products
          .filter(p => (selectedCategory === "Todos" || (p.category || "Geral") === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
      </div>
    </div>
  );
}