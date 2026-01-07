"use client";

import { useCart } from "@/contexts/cart-context";

export function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart();

  return (
    <button 
        onClick={() => addToCart(product)}
        className="w-full rounded-lg bg-white py-2 text-xs font-bold uppercase text-black transition-colors hover:bg-zinc-200"
    >
        Adicionar
    </button>
  );
}