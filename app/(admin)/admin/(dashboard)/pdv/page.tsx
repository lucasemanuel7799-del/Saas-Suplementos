"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Search, PackageX, Loader2, Save, X, ScanBarcode } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import CartSidebar from "@/components/admin/sidebar-cart"; // Importação do Carrinho

export default function PDVPage() {
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // --- DADOS E ESTADOS ---
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("credit_card"); 
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados Modal Cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [isSavingClient, setIsSavingClient] = useState(false);

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA DE DADOS ---
  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: productsData } = await supabase.from("products").select("*").eq("store_id", user?.id).eq("active", true).gt("stock", 0).order("name");
    const { data: customersData } = await supabase.from("customers").select("id, name, phone").eq("store_id", user?.id).order("name");

    if (productsData) {
        setProducts(productsData);
        const cats = Array.from(new Set(productsData.map(p => p.category).filter(Boolean)));
        setCategories(["Todos", ...cats] as string[]);
    }
    if (customersData) setCustomers(customersData);
    setLoading(false);
  }

  // --- LÓGICA DO SCANNER ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const exactMatch = products.find(p => p.barcode === searchTerm.trim());
        if (exactMatch) { addToCart(exactMatch); setSearchTerm(""); toast.success(`${exactMatch.name} adicionado!`); }
    }
  };

  useEffect(() => {
    const exactMatch = products.find(p => p.barcode === searchTerm.trim());
    if (exactMatch) {
         const timer = setTimeout(() => { addToCart(exactMatch); setSearchTerm(""); toast.success("Item bipado!"); }, 200);
         return () => clearTimeout(timer);
    }
  }, [searchTerm, products]);

  // --- FUNÇÕES DO CARRINHO (Passadas para o componente Sidebar) ---
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) return toast.error("Estoque insuficiente!");
        setCart(prev => prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
        setCart(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty < 1) return item; 
            if (newQty > item.stock) return item;
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Carrinho vazio!");
    setIsProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let customerName = "Consumidor Final (Balcão)";
    if (selectedCustomer) { const cust = customers.find(c => c.id === selectedCustomer); if (cust) customerName = cust.name; }

    const orderPayload = {
        store_id: user?.id, customer_name: customerName, address: "Venda em Loja Física", 
        total_amount: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        status: 'completed', items: cart, payment_method: paymentMethod, origin: 'pdv', created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("orders").insert(orderPayload);
    if (error) { toast.error("Erro na venda."); setIsProcessing(false); return; }

    for (const item of cart) { await supabase.from("products").update({ stock: item.stock - item.quantity }).eq("id", item.id); }
    toast.success("Venda Finalizada!");
    setCart([]); setSelectedCustomer(null); setPaymentMethod("credit_card"); fetchData(); setIsProcessing(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return toast.error("Nome obrigatório");
    setIsSavingClient(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("customers").insert({ store_id: user?.id, name: newClientName, phone: newClientPhone }).select().single();
        if (error) throw error;
        setCustomers(prev => [...prev, data].sort((a:any,b:any) => a.name.localeCompare(b.name)));
        setSelectedCustomer(data.id);
        toast.success("Cliente cadastrado!");
        setIsClientModalOpen(false); setNewClientName(""); setNewClientPhone("");
    } catch (e) { toast.error("Erro ao cadastrar."); } finally { setIsSavingClient(false); }
  };

  // --- FILTROS ---
  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower) || (p.barcode && p.barcode.includes(searchLower));
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    // ESTRUTURA FIXA: Container principal trava a tela, esquerda rola, direita fixa.
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden relative">
      
      {/* ESQUERDA: CATÁLOGO (Rola Naturalmente) */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Header e Busca */}
        <div className="shrink-0 mb-4 space-y-4">
            <div><h1 className="text-2xl font-bold text-white tracking-tight">Frente de Caixa</h1><p className="text-zinc-400 text-sm">Bipe o produto ou busque pelo nome.</p></div>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                    <input ref={searchInputRef} autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} placeholder="Bipe o código de barras ou digite..." className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-orange-500 outline-none" />
                    <div className="absolute right-3 top-3 text-zinc-600"><ScanBarcode size={20} /></div>
                </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 shrink-0">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${selectedCategory === cat ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"}`}>{cat}</button>
                ))}
            </div>
        </div>

        {/* Grid de Produtos (Scroll Aqui) */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 pb-20">
            {loading ? <div className="text-center py-20 text-zinc-500">Carregando...</div> : 
             filteredProducts.length === 0 ? <div className="text-center py-20 text-zinc-500 flex flex-col items-center"><PackageX size={48} className="mb-2 text-zinc-700"/>Produto não encontrado.</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map(product => (
                        <button key={product.id} onClick={() => addToCart(product)} className="group flex flex-col text-left bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500 transition-all active:scale-95">
                            <div className="h-32 w-full bg-zinc-800 relative">
                                {product.image_url ? <Image src={product.image_url} alt={product.name} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-zinc-600"><ScanBarcode size={24}/></div>}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white">{product.stock} un</div>
                            </div>
                            <div className="p-3">
                                <p className="font-bold text-sm text-zinc-200 line-clamp-1 group-hover:text-orange-500 transition-colors">{product.name}</p>
                                <div className="flex justify-between items-end mt-1">
                                    <p className="font-bold text-lg text-emerald-400">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                    {product.volume && <span className="text-[10px] text-zinc-500 bg-zinc-950 px-1 rounded">{product.volume}</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* DIREITA: SIDEBAR DO CARRINHO (Componente Separado) */}
      <CartSidebar 
        cart={cart}
        customers={customers}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        isProcessing={isProcessing}
        total={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onSelectCustomer={setSelectedCustomer}
        onSelectPayment={setPaymentMethod}
        onCheckout={handleCheckout}
        onAddNewClient={() => setIsClientModalOpen(true)}
      />

      {/* Modal Novo Cliente (Fica na Page pois depende de estados locais de criação) */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center"><h2 className="text-lg font-bold text-white">Novo Cliente</h2><button onClick={() => setIsClientModalOpen(false)}><X className="text-zinc-500 hover:text-white" /></button></div>
                <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                    <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Nome</label><input autoFocus required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do Cliente" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Telefone</label><input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" /></div>
                    <div className="pt-2 flex gap-3"><button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-sm rounded-xl">Cancelar</button><button type="submit" disabled={isSavingClient} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">{isSavingClient ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}