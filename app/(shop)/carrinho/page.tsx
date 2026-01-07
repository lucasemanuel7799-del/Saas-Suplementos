"use client";

import { useCart } from "@/contexts/cart-context";
import { Trash2, Minus, Plus, ArrowLeft, MapPin, Truck, Store, Search, Loader2, X, ChevronRight, Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const router = useRouter();
  
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savedAddress, setSavedAddress] = useState<null | typeof address>(null);

  const [cep, setCep] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: ""
  });

  async function handleCepSearch(value: string) {
    const cleanCep = value.replace(/\D/g, "");
    setCep(cleanCep);

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro CEP", error);
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleSaveAddress() {
    if (!address.street || !address.number) {
        alert("Preencha Rua e Número.");
        return;
    }
    setSavedAddress(address);
    setIsAddressModalOpen(false);
  }

  async function handleCheckout() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Faça login para finalizar.");
        return;
    }
    if (items.length === 0) return;
    if (deliveryType === 'delivery' && !savedAddress) {
        alert("Adicione o endereço de entrega.");
        return;
    }

    let message = `*NOVO PEDIDO DO SITE*\n\n`;
    items.forEach((item) => message += `• ${item.quantity}x ${item.name}\n`);
    
    const shippingCost = deliveryType === 'delivery' ? 10.00 : 0;
    const finalTotal = total + shippingCost;

    message += `\n*Subtotal: ${formatCurrency(total)}*`;
    if (deliveryType === 'delivery') message += `\n*Frete: ${formatCurrency(shippingCost)}*`;
    message += `\n*TOTAL: ${formatCurrency(finalTotal)}*\n`;
    message += `\n------------------\n`;
    
    if (deliveryType === 'pickup') {
      message += `📍 *Retirar na Loja*`;
    } else {
      message += `🚚 *Entrega*\n`;
      message += `📍 ${savedAddress?.street}, ${savedAddress?.number}`;
      if (savedAddress?.complement) message += ` - ${savedAddress.complement}`;
      message += `\n${savedAddress?.neighborhood} - ${savedAddress?.city}/${savedAddress?.state}`;
      message += `\nCEP: ${cep}`;
    }

    const whatsappNumber = "5511999999999"; 
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
    clearCart();
    router.push("/");
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black p-4 text-center">
        <div className="mb-4 rounded-full bg-zinc-900/50 p-6"><Truck size={48} className="text-zinc-500" /></div>
        <h2 className="mb-2 text-xl font-bold text-white">Carrinho vazio</h2>
        <Link href="/" className="rounded-full bg-white px-8 py-3 font-bold text-black">Voltar</Link>
      </div>
    );
  }

  const shippingCost = deliveryType === "delivery" ? 10.00 : 0;
  const finalTotal = total + shippingCost;

  return (
    <div className="flex h-screen flex-col bg-black text-zinc-100 overflow-hidden">
      
      {/* HEADER DO CARRINHO */}
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800 bg-black p-4">
        <Link href="/" className="rounded-full bg-zinc-900 p-2 text-white hover:bg-zinc-800"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold text-white">Carrinho ({items.length})</h1>
      </div>

      {/* CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40 scrollbar-hide">
        
        {/* LISTA */}
        <div className="space-y-3">
            {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {item.image_url ? <Image src={item.image_url} alt={item.name} fill className="object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-600"><Store size={24} /></div>}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                    <div>
                        <h3 className="line-clamp-1 font-medium text-white">{item.name}</h3>
                        <p className="text-sm font-semibold text-blue-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-lg bg-zinc-900 p-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800"><Minus size={14} /></button>
                            <span className="min-w-[1.5rem] text-center text-sm font-medium text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="rounded-lg p-2 text-zinc-500 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                </div>
            </div>
            ))}
        </div>

        {/* OPÇÕES DE ENTREGA */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Entrega</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDeliveryType("delivery")} className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${deliveryType === "delivery" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-400"}`}><Truck size={24} /><span className="text-sm font-medium">Entrega</span></button>
            <button onClick={() => setDeliveryType("pickup")} className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${deliveryType === "pickup" ? "border-green-500 bg-green-500/10 text-green-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-400"}`}><Store size={24} /><span className="text-sm font-medium">Retirada</span></button>
          </div>

          {deliveryType === "delivery" && (
            <div className="animate-in fade-in slide-in-from-top-2">
                {!savedAddress ? (
                    <button onClick={() => setIsAddressModalOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-700 bg-zinc-900/20 p-4 text-zinc-400 hover:bg-zinc-900/40">
                        <div className="flex items-center gap-3"><div className="rounded-full bg-zinc-800 p-2 text-zinc-400"><Plus size={18} /></div><span className="font-medium">Adicionar endereço</span></div><ChevronRight size={18} />
                    </button>
                ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 rounded-full bg-blue-500/10 p-2 text-blue-400"><MapPin size={18} /></div>
                                <div>
                                    <h3 className="font-medium text-white">Endereço de Entrega</h3>
                                    <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{savedAddress.street}, {savedAddress.number} {savedAddress.complement && ` - ${savedAddress.complement}`}</p>
                                    <p className="text-xs text-zinc-500">{savedAddress.neighborhood} - {savedAddress.city}/{savedAddress.state}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddressModalOpen(true)} className="text-xs font-medium text-blue-400 hover:text-blue-300">Trocar</button>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER FIXO */}
      <div className="fixed bottom-[56px] left-0 right-0 border-t border-zinc-800 bg-black p-4 shadow-lg z-10">
        <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-zinc-400">Total com frete</div>
            <div className="text-xl font-bold text-white">{formatCurrency(finalTotal)}</div>
        </div>
        <button onClick={handleCheckout} className="w-full rounded-xl bg-green-600 py-3 text-base font-bold text-white shadow-lg shadow-green-900/20 active:scale-95">Finalizar Pedido</button>
      </div>

      {/* --- MODAL DE ENDEREÇO EM TELA CHEIA (OVERLAY) --- */}
      {/* z-[100] garante que fique acima do menu de navegação */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 animate-in slide-in-from-bottom-5">
            
            {/* Header do Modal */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 p-4">
                <h2 className="text-lg font-bold text-white">Endereço de Entrega</h2>
                <button onClick={() => setIsAddressModalOpen(false)} className="rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>

            {/* Corpo do Modal (Scrollável) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                <div className="relative">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">CEP</label>
                    <div className="relative">
                        <input 
                            type="tel" maxLength={8} placeholder="00000000" value={cep}
                            onChange={(e) => handleCepSearch(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-black p-4 pr-10 text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                        />
                        <div className="absolute right-4 top-4 text-zinc-500">
                            {loadingCep ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Rua</label>
                        <input type="text" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Número</label>
                        <input type="tel" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-center text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Bairro</label>
                        <input type="text" value={address.neighborhood} onChange={e => setAddress({...address, neighborhood: e.target.value})} className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Cidade</label>
                        <input type="text" value={address.city} readOnly className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-400 focus:outline-none" />
                    </div>
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Complemento (Opcional)</label>
                    <input type="text" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} placeholder="Ex: Casa verde" className="w-full rounded-xl border border-zinc-800 bg-black p-4 text-white focus:border-blue-500 focus:outline-none" />
                </div>

                {/* Botão Salvar (Dentro do scroll, mas com espaço embaixo) */}
                <div className="pt-4 pb-10">
                    <button 
                        onClick={handleSaveAddress}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-colors hover:bg-blue-500"
                    >
                        <Save size={20} />
                        Salvar Endereço
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}