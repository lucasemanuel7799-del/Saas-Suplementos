"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ShoppingCart, Trash2, CreditCard, Banknote, QrCode, 
  User, CheckCircle2, Loader2, UserPlus, X 
} from "lucide-react";
import Image from "next/image";

// --- SUB-COMPONENTE INTERNO: BUSCA DE CLIENTE ---
function ClientSearchSelect({ customers, selectedId, onSelect, onAddNew }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const selectedCustomer = customers.find((c: any) => c.id === selectedId);
  const filtered = customers.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex gap-2">
        <div 
            onClick={() => setIsOpen(!isOpen)} 
            className={`flex-1 bg-zinc-900 border text-sm rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-orange-500 ring-1 ring-orange-500' : 'border-zinc-800 hover:border-zinc-700'}`}
        >
          <div className="flex items-center gap-2 text-white truncate">
            <User size={16} className="text-zinc-500" />
            <span className={selectedCustomer ? "text-white font-bold" : "text-zinc-400"}>
                {selectedCustomer ? selectedCustomer.name : "Consumidor Final"}
            </span>
          </div>
        </div>
        <button 
            onClick={onAddNew} 
            className="bg-zinc-800 hover:bg-orange-600 hover:text-white text-zinc-400 border border-zinc-700 rounded-lg w-11 flex items-center justify-center transition-all active:scale-95"
            title="Novo Cliente"
        >
            <UserPlus size={18} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-64 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 bottom-full mb-1">
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/95 sticky top-0">
             <input 
                autoFocus 
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-orange-500 outline-none placeholder-zinc-600" 
                placeholder="Buscar cliente..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
             />
          </div>
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 max-h-48">
             <button onClick={() => { onSelect(null); setIsOpen(false); setSearch(""); }} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-800 border-b border-zinc-800/50 flex items-center gap-2 ${selectedId === null ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-300'}`}>
                <User size={14} /> Consumidor Final
             </button>
             {filtered.map((cust: any) => (
                 <button key={cust.id} onClick={() => { onSelect(cust.id); setIsOpen(false); setSearch(""); }} className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-800 flex flex-col ${selectedId === cust.id ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-300'}`}>
                    <span className="font-bold">{cust.name}</span>
                    {cust.phone && <span className="text-[10px] text-zinc-500">{cust.phone}</span>}
                 </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PROPS E COMPONENTE PRINCIPAL ---
interface CartSidebarProps {
  cart: any[];
  customers: any[];
  selectedCustomer: string | null;
  paymentMethod: string;
  isProcessing: boolean;
  total: number;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSelectCustomer: (id: string | null) => void;
  onSelectPayment: (method: string) => void;
  onCheckout: () => void;
  onAddNewClient: () => void;
}

export default function CartSidebar({
  cart,
  customers,
  selectedCustomer,
  paymentMethod,
  isProcessing,
  total,
  onRemoveItem,
  onUpdateQuantity,
  onSelectCustomer,
  onSelectPayment,
  onCheckout,
  onAddNewClient
}: CartSidebarProps) {
  
  return (
    <div className="w-96 shrink-0 h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header (Fixo) */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-orange-500"/> Carrinho
            </h2>
            <span className="text-xs font-mono text-zinc-500">{cart.length} itens</span>
        </div>

        {/* Lista de Itens (Rola apenas aqui) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50">
                    <ShoppingCart size={48} />
                    <p className="text-sm font-bold">Aguardando bip...</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-start bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                        <div className="h-12 w-12 bg-zinc-800 rounded-lg shrink-0 overflow-hidden relative">
                             {item.image_url ? (
                                <Image src={item.image_url} alt="" fill className="object-cover" />
                             ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-600"><ShoppingCart size={16}/></div>
                             )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.name}</p>
                            <p className="text-xs text-emerald-400 font-bold mt-0.5">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <button onClick={() => onRemoveItem(item.id)} className="text-zinc-600 hover:text-red-500 p-0.5 transition-colors">
                                <Trash2 size={14}/>
                            </button>
                            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg border border-zinc-800 p-0.5">
                                <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded">-</button>
                                <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                                <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-orange-600 hover:bg-orange-500 rounded text-white text-xs">+</button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer (Fixo) */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-4 shrink-0">
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Cliente</label>
                <ClientSearchSelect customers={customers} selectedId={selectedCustomer} onSelect={onSelectCustomer} onAddNew={onAddNewClient}/>
            </div>
            <div>
                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        {id: 'credit_card', label: 'Crédito', icon: CreditCard}, 
                        {id: 'debit_card', label: 'Débito', icon: CreditCard}, 
                        {id: 'pix', label: 'Pix', icon: QrCode}, 
                        {id: 'cash', label: 'Dinheiro', icon: Banknote}
                    ].map(m => (
                        <button key={m.id} onClick={() => onSelectPayment(m.id)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${paymentMethod === m.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>
                            <m.icon size={16} />
                            <span className="text-[10px] font-bold truncate w-full text-center">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="pt-2">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-zinc-400 text-sm">Total a Pagar</span>
                    <span className="text-3xl font-bold text-white">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button onClick={onCheckout} disabled={isProcessing || cart.length === 0} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} 
                    FINALIZAR VENDA
                </button>
            </div>
        </div>
    </div>
  );
}