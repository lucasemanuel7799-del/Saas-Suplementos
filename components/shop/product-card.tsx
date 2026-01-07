"use client";

import { useCart } from "@/contexts/cart-context";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    category?: string;
    flavor?: string;
    brand?: string;
    volume?: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  
  const quantity = getItemQuantity(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <Link 
      href={`/produto/${product.id}`} 
      className="group flex flex-col rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden h-full hover:border-zinc-700 transition-all"
    >
      
      {/* 1. IMAGEM */}
      <div className="relative aspect-square w-full bg-zinc-900">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-700">
            <ShoppingBag size={24} />
          </div>
        )}
      </div>

      {/* 2. CONTEÚDO */}
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <span className="mb-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            {product.brand}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-medium text-zinc-100 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1 mb-3">
           {product.volume && (
             <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
               {product.volume}
             </span>
           )}
           {product.flavor && (
             <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
               {product.flavor}
             </span>
           )}
        </div>

        {/* PREÇO E BOTÃO */}
        <div className="mt-auto pt-2 space-y-3">
          
          <div>
            <span className="text-lg font-bold text-white block">
              {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div onClick={(e) => e.preventDefault()}> 
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 text-sm font-bold text-zinc-200 hover:bg-blue-600 hover:text-white transition-all active:scale-95 border border-zinc-700 hover:border-blue-500"
              >
                Adicionar
              </button>
            ) : (
              <div className="flex h-10 w-full items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 px-1">
                <button
                  onClick={handleDecrease}
                  className="flex h-8 w-10 items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <Minus size={16} />
                </button>
                
                <span className="font-bold text-white text-sm">
                  {quantity}
                </span>
                
                <button
                  onClick={handleIncrease}
                  className="flex h-8 w-10 items-center justify-center rounded hover:bg-zinc-700 text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </Link>
  );
}