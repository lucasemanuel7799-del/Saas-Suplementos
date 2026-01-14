"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  TicketPercent, Plus, Copy, Trash2, Tag, Users, Clock, 
  CheckCircle2, X, Loader2, Percent, DollarSign, AlertTriangle, 
  Package, Search, Briefcase, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

// --- COMPONENTE DE SELEÇÃO COM BUSCA ---
interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: Option[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg bg-zinc-900 border p-2.5 text-white flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-orange-500 ring-1 ring-orange-500' : 'border-zinc-800 hover:border-zinc-700'}`}
      >
        <span className={selectedItem ? "text-white text-sm" : "text-zinc-500 text-sm"}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/95 sticky top-0">
            <div className="flex items-center gap-2 bg-zinc-950 rounded-md px-2 py-1.5 border border-zinc-800">
              <Search size={14} className="text-zinc-500" />
              <input 
                autoFocus
                className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-zinc-600"
                placeholder="Filtrar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">Nenhum resultado.</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors flex flex-col ${value === opt.value ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-300'}`}
                >
                  <span className="font-bold uppercase tracking-tight">{opt.label}</span>
                  {opt.subLabel && <span className="text-[10px] text-zinc-500">{opt.subLabel}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---

export default function PromotionsPage() {
  const supabase = createClient();
  
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
      code: "",
      description: "",
      discount_type: "percentage", 
      discount_value: "",
      usage_type: "all", 
      target_type: "all", 
      target_id: "" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Busca ID da Loja (UUID)
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (store) {
      setStoreId(store.id);

      // 2. Busca Cupons e Produtos usando store.id
      const [couponsRes, productsRes] = await Promise.all([
        supabase.from("coupons").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, category, brand").eq("store_id", store.id).eq("active", true).order("name", { ascending: true })
      ]);

      if (couponsRes.data) setCoupons(couponsRes.data);
      if (productsRes.data) {
        setProducts(productsRes.data);
        setCategories(Array.from(new Set(productsRes.data.map(p => p.category).filter(Boolean))) as string[]);
        setBrands(Array.from(new Set(productsRes.data.map(p => p.brand).filter(Boolean))) as string[]);
      }
    }
    setLoading(false);
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !currentState } : c));
    await supabase.from("coupons").update({ active: !currentState }).eq("id", id);
    toast.success(`Cupom ${!currentState ? 'ativado' : 'desativado'}.`);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    const id = deleteConfirmationId;
    setCoupons(prev => prev.filter(c => c.id !== id));
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Cupom removido.");
    setDeleteConfirmationId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Loja não identificada.");
    if (formData.target_type !== 'all' && !formData.target_id) {
        toast.error("Selecione o item do desconto.");
        return;
    }
    setSaving(true);
    
    try {
        const { error } = await supabase.from("coupons").insert({
            store_id: storeId, // UUID DA LOJA CORRIGIDO
            code: formData.code.toUpperCase().trim(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value.toString().replace(",", ".")),
            usage_type: formData.usage_type,
            target_type: formData.target_type,
            target_id: formData.target_type !== 'all' ? formData.target_id : null,
            active: true
        });

        if (error) throw error;
        toast.success("Promoção ativa!");
        setIsModalOpen(false);
        setFormData({ code: "", description: "", discount_type: "percentage", discount_value: "", usage_type: "all", target_type: "all", target_id: "" });
        fetchData();
    } catch (error: any) {
        toast.error(error.message || "Erro ao criar cupom.");
    } finally {
        setSaving(false);
    }
  };

  const getTargetLabel = (type: string, id: string) => {
    if (type === 'product') {
        const p = products.find(prod => prod.id === id);
        return p ? p.name : 'Produto';
    }
    return id;
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative p-1 md:p-0">
      
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Promoções & Cupons</h1>
            <p className="text-zinc-400 text-sm mt-1">Gerencie descontos para a vitrine e checkout.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95">
            <Plus size={18} /> Nova Promoção
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-10 scrollbar-hide">
        {loading ? (
             <div className="col-span-full text-center py-20 text-zinc-500"><Loader2 className="animate-spin mx-auto" /></div>
        ) : coupons.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                <TicketPercent className="mx-auto text-zinc-800 mb-4" size={48} />
                <h3 className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Nenhuma promoção ativa</h3>
             </div>
        ) : (
            coupons.map((coupon) => (
                <div key={coupon.id} className={`group relative overflow-hidden rounded-2xl border transition-all ${coupon.active ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50' : 'bg-zinc-950 border-zinc-800 opacity-60'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${coupon.active ? 'bg-orange-500' : 'bg-zinc-700'}`} />
                    <div className="p-5 pl-7">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-mono text-xl font-bold text-white tracking-wider flex items-center gap-2">
                                    {coupon.code}
                                    <button onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success("Copiado!"); }} className="text-zinc-600 hover:text-orange-500 transition-colors"><Copy size={14} /></button>
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1 tracking-tighter">{coupon.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${coupon.active ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} OFF
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {coupon.usage_type === 'first_order' && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">1ª Compra</span>}
                            {coupon.target_type !== 'all' && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 truncate max-w-[180px]">
                                    {coupon.target_type === 'brand' && "MARCA: "}
                                    {getTargetLabel(coupon.target_type, coupon.target_id)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Ativo:</span>
                                <button onClick={() => toggleActive(coupon.id, coupon.active)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${coupon.active ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${coupon.active ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <button onClick={() => setDeleteConfirmationId(coupon.id)} className="text-zinc-700 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* MODAL CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 uppercase tracking-widest text-[10px] font-bold text-white">
                    Nova Promoção <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Código Cupom</label>
                            <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="EX: NATAL20" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white font-mono uppercase focus:border-orange-500 outline-none text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor Desconto</label>
                            <div className="relative">
                                <input required type="text" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} placeholder="0,00" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-2.5 pr-8 p-2.5 text-white focus:border-orange-500 outline-none text-sm" />
                                <div className="absolute right-2 top-2.5 text-zinc-600">{formData.discount_type === 'percentage' ? <Percent size={14}/> : <DollarSign size={14}/>}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.discount_type === 'percentage'} onChange={() => setFormData({...formData, discount_type: 'percentage'})} className="accent-orange-500" /><span className="text-xs text-zinc-400 font-bold uppercase">Porcentagem (%)</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.discount_type === 'fixed'} onChange={() => setFormData({...formData, discount_type: 'fixed'})} className="accent-orange-500" /><span className="text-xs text-zinc-400 font-bold uppercase">Valor Fixo (R$)</span></label>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Descrição Interna</label>
                        <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Campanha de Inverno" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Restrição de Uso</label>
                        <select value={formData.usage_type} onChange={e => setFormData({...formData, usage_type: e.target.value})} className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white text-sm focus:border-orange-500 outline-none">
                            <option value="all">Padrão (Sem restrição)</option>
                            <option value="first_order">Apenas Primeira Compra</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Onde aplicar?</label>
                        <div className="space-y-3">
                             <select value={formData.target_type} onChange={e => setFormData({...formData, target_type: e.target.value, target_id: ""})} className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white text-sm outline-none">
                                <option value="all">Loja Inteira</option>
                                <option value="category">Por Categoria</option>
                                <option value="brand">Por Marca</option>
                                <option value="product">Por Produto</option>
                            </select>

                            {formData.target_type === 'category' && (
                                <SearchableSelect placeholder="Selecione Categoria..." value={formData.target_id} onChange={(val) => setFormData({...formData, target_id: val})} options={categories.map(c => ({ value: c, label: c }))} />
                            )}
                            {formData.target_type === 'brand' && (
                                <SearchableSelect placeholder="Selecione Marca..." value={formData.target_id} onChange={(val) => setFormData({...formData, target_id: val})} options={brands.map(b => ({ value: b, label: b }))} />
                            )}
                            {formData.target_type === 'product' && (
                                <SearchableSelect placeholder="Selecione Produto..." value={formData.target_id} onChange={(val) => setFormData({...formData, target_id: val})} options={products.map(p => ({ value: p.id, label: p.name, subLabel: p.brand }))} />
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin mx-auto" /> : "Ativar Promoção"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* CONFIRMAÇÃO EXCLUSÃO */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
                <div className="h-12 w-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle size={24} /></div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Excluir Cupom?</h2>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setDeleteConfirmationId(null)} className="flex-1 py-3 rounded-xl bg-zinc-900 text-zinc-500 font-bold text-[10px] uppercase border border-zinc-800">Cancelar</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-[10px] uppercase shadow-lg shadow-red-900/20">Excluir</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}