"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Search, PackageX, Loader2, Save, X, ScanBarcode } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import CartSidebar from "@/components/admin/sidebar-cart";

export default function PDVPage() {
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // --- DADOS E ESTADOS ---
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

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
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Busca o ID da Loja (UUID) via owner_id
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (store) {
      setStoreId(store.id);

      // 2. Busca Produtos e Clientes usando o store.id REAL
      const [prodRes, custRes] = await Promise.all([
        supabase.from("products").select("*").eq("store_id", store.id).eq("active", true).gt("stock", 0).order("name"),
        supabase.from("customers").select("id, name, phone").eq("store_id", store.id).order("name")
      ]);

      if (prodRes.data) {
          setProducts(prodRes.data);
          const cats = Array.from(new Set(prodRes.data.map(p => p.category).filter(Boolean)));
          setCategories(["Todos", ...cats] as string[]);
      }
      if (custRes.data) setCustomers(custRes.data);
    }
    
    setLoading(false);
  }

  // --- LÓGICA DO SCANNER ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        const exactMatch = products.find(p => p.barcode === searchTerm.trim());
        if (exactMatch) { 
          addToCart(exactMatch); 
          setSearchTerm(""); 
          toast.success(`${exactMatch.name} adicionado!`); 
        }
    }
  };

  useEffect(() => {
    const exactMatch = products.find(p => p.barcode === searchTerm.trim());
    if (exactMatch && searchTerm.trim() !== "") {
         const timer = setTimeout(() => { 
           addToCart(exactMatch); 
           setSearchTerm(""); 
           toast.success("Item bipado!"); 
         }, 200);
         return () => clearTimeout(timer);
    }
  }, [searchTerm, products]);

  // --- FUNÇÕES DO CARRINHO ---
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
    if (!storeId) return toast.error("Loja não identificada.");
    
    setIsProcessing(true);
    
    let customerName = "Consumidor Final (Balcão)";
    if (selectedCustomer) { 
      const cust = customers.find(c => c.id === selectedCustomer); 
      if (cust) customerName = cust.name; 
    }

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const orderPayload = {
        store_id: storeId, // UUID da loja corrigido
        customer_name: customerName, 
        address: "Venda em Loja Física", 
        total_amount: totalAmount,
        status: 'completed', 
        items: cart, 
        payment_method: paymentMethod, 
        origin: 'pdv', 
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("orders").insert(orderPayload);
    
    if (error) { 
      toast.error("Erro ao registrar venda."); 
      setIsProcessing(false); 
      return; 
    }

    // Atualiza estoque de cada item
    for (const item of cart) { 
      await supabase.from("products")
        .update({ stock: item.stock - item.quantity })
        .eq("id", item.id); 
    }

    toast.success("Venda Finalizada com Sucesso!");
    setCart([]); 
    setSelectedCustomer(null); 
    setPaymentMethod("credit_card"); 
    fetchData(); // Recarrega produtos para atualizar estoques na tela
    setIsProcessing(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return toast.error("Nome obrigatório");
    if (!storeId) return toast.error("Erro de identificação da loja.");
    
    setIsSavingClient(true);
    try {
        const { data, error } = await supabase
          .from("customers")
          .insert({ 
            store_id: storeId, // UUID da loja corrigido
            name: newClientName, 
            phone: newClientPhone 
          })
          .select()
          .single();

        if (error) throw error;

        setCustomers(prev => [...prev, data].sort((a:any,b:any) => a.name.localeCompare(b.name)));
        setSelectedCustomer(data.id);
        toast.success("Cliente cadastrado!");
        setIsClientModalOpen(false); 
        setNewClientName(""); 
        setNewClientPhone("");
    } catch (e) { 
      toast.error("Erro ao cadastrar cliente."); 
    } finally { 
      setIsSavingClient(false); 
    }
  };

  // --- FILTROS ---
  const filteredProducts = products.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower) || (p.barcode && p.barcode.includes(searchLower));
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden relative">
      
      {/* ESQUERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        <div className="shrink-0 mb-4 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Frente de Caixa</h1>
              <p className="text-zinc-400 text-sm">Bipe o produto ou busque pelo nome.</p>
            </div>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                    <input 
                      ref={searchInputRef} 
                      autoFocus 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      onKeyDown={handleKeyDown} 
                      placeholder="Bipe o código de barras ou digite..." 
                      className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-orange-500 outline-none" 
                    />
                    <div className="absolute right-3 top-3 text-zinc-600"><ScanBarcode size={20} /></div>
                </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-hide">
                {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors border ${selectedCategory === cat ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"}`}
                    >
                      {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 pb-20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Estoque...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
                <PackageX size={48} className="mb-2 text-zinc-800"/>
                <p className="text-xs font-bold uppercase">Nenhum produto em estoque</p>
              </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map(product => (
                        <button key={product.id} onClick={() => addToCart(product)} className="group flex flex-col text-left bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500 transition-all active:scale-95">
                            <div className="h-32 w-full bg-zinc-800/50 relative">
                                {product.image_url ? (
                                  <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-zinc-700"><ScanBarcode size={24}/></div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/5">{product.stock} UN</div>
                            </div>
                            <div className="p-3">
                                <p className="font-bold text-sm text-zinc-200 line-clamp-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{product.name}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <p className="font-bold text-lg text-emerald-400 font-mono">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                    {product.volume && <span className="text-[9px] font-bold text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-white/5">{product.volume}</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* DIREITA: SIDEBAR DO CARRINHO */}
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

      {/* Modal Novo Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">Novo Cliente</h2>
                  <button onClick={() => setIsClientModalOpen(false)}><X className="text-zinc-500 hover:text-white" size={20}/></button>
                </div>
                <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome Completo</label>
                      <input autoFocus required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do Cliente" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">WhatsApp</label>
                      <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                    <div className="pt-2 flex gap-3">
                      <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-3 bg-zinc-900 text-zinc-500 font-bold text-[10px] uppercase rounded-xl border border-zinc-800">Cancelar</button>
                      <button type="submit" disabled={isSavingClient} className="flex-1 py-3 bg-orange-600 text-white font-bold text-[10px] uppercase rounded-xl flex items-center justify-center gap-2">{isSavingClient ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}