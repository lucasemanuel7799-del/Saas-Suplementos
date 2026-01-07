"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// 1. Definição do Tipo do Item
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  flavor?: string;
  volume?: string;
}

// 2. Definição do Contexto (Aqui que estava faltando o updateQuantity em algumas versões)
interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number, flavor?: string, volume?: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void; // <--- ESSA LINHA RESOLVE O ERRO
  getItemQuantity: (productId: number) => number; // Nova função útil pro card
  clearCart: () => void;
  totalItems: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar do LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("@loja:cart");
    if (savedCart) {
      try { setItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
  }, []);

  // Salvar no LocalStorage
  useEffect(() => {
    localStorage.setItem("@loja:cart", JSON.stringify(items));
  }, [items]);

  // Adicionar
  function addToCart(product: any, quantity = 1, flavor?: string, volume?: string) {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          quantity: quantity,
          flavor: flavor || product.flavor,
          volume: volume || product.volume
        }];
      }
    });
  }

  // Remover
  function removeItem(productId: number) {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  // Atualizar Quantidade
  function updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  }

  // Pegar quantidade de um item específico (Útil para o Card saber quantos tem)
  function getItemQuantity(productId: number) {
    const item = items.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        totalItems,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}