"use client";

import { useCart } from "@/contexts/cart-context";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/navigation"; // Se precisar de navegação programática
import { useParams } from "next/navigation";

export default function CarrinhoPage() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();
  const params = useParams();
  const slug = params.slug;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="bg-zinc-100 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-zinc-400" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Seu carrinho está vazio</h1>
        <p className="text-zinc-500 mt-2 mb-6">Parece que você ainda não adicionou nenhum suplemento.</p>
        <a 
          href={`/${slug}`}
          className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
        >
          Voltar para a loja
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pt-8">
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">Minha Cesta</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-zinc-200 p-4 rounded-2xl flex gap-4 shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-100">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={24} className="text-zinc-300" />
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-tight">
                  {item.name}
                </h3>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-zinc-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-end">
                <span className="font-bold text-orange-600 text-base">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
                
                <div className="flex items-center gap-3 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-white rounded-md transition-all shadow-sm"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-white rounded-md transition-all shadow-sm"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RESUMO DO PEDIDO */}
      <div className="bg-white border-t border-zinc-100 p-6 -mx-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[32px]">
        <div className="flex justify-between items-center mb-6">
          <span className="text-zinc-500 font-medium text-lg">Total do pedido</span>
          <span className="text-2xl font-black text-zinc-900">R$ {totalPrice.toFixed(2)}</span>
        </div>

        <button 
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/20 active:scale-95 transition-all"
        >
          Finalizar Pedido <ArrowRight size={20} />
        </button>
        <p className="text-center text-[10px] text-zinc-400 mt-4 uppercase tracking-widest font-bold">
          Pedido será finalizado via WhatsApp
        </p>
      </div>
    </div>
  );
}