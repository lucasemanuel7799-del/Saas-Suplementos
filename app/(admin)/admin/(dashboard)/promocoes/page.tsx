"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  TicketPercent, Plus, Copy, Trash2, Tag, Users, Clock, 
  CheckCircle2, X, Loader2, Percent, DollarSign, AlertTriangle, 
  Package, Search, Briefcase, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

// --- COMPONENTE DE SELEÇÃO COM BUSCA (SEARCHABLE SELECT) ---
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

  // Encontra o item selecionado para mostrar o nome
  const selectedItem = options.find(opt => opt.value === value);

  // Filtra as opções baseado na busca
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Fecha ao clicar fora
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
      {/* O Campo Visível */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-lg bg-zinc-900 border p-2.5 text-white flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'border-orange-500 ring-1 ring-orange-500' : 'border-zinc-800 hover:border-zinc-700'}`}
      >
        <span className={selectedItem ? "text-white" : "text-zinc-500"}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* O Dropdown Flutuante */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Campo de Busca Interno */}
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/95 sticky top-0">
            <div className="flex items-center gap-2 bg-zinc-950 rounded-md px-2 py-1.5 border border-zinc-800">
              <Search size={14} className="text-zinc-500" />
              <input 
                autoFocus
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-zinc-600"
                placeholder="Digitar para filtrar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">Nenhum resultado encontrado.</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch(""); // Limpa busca ao selecionar
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors flex flex-col ${value === opt.value ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-300'}`}
                >
                  <span className="font-medium">{opt.label}</span>
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
  
  // --- Estados de Dados ---
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]); // Lista de Marcas Únicas
  const [categories, setCategories] = useState<string[]>([]); // Lista de Categorias Únicas
  const [loading, setLoading] = useState(true);
  
  // --- Estados de Modais ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // --- Formulário ---
  const [formData, setFormData] = useState({
      code: "",
      description: "",
      discount_type: "percentage", 
      discount_value: "",
      usage_type: "all", 
      target_type: "all", // all | category | product | brand
      target_id: "" 
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Busca Cupons
    const { data: couponsData } = await supabase
      .from("coupons")
      .select("*")
      .eq("store_id", user?.id)
      .order("created_at", { ascending: false });

    // 2. Busca Produtos (Para extrair Produtos, Categorias e Marcas)
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, category, brand")
      .eq("store_id", user?.id)
      .eq("active", true)
      .order("name", { ascending: true });

    if (couponsData) setCoupons(couponsData);
    
    if (productsData) {
      setProducts(productsData);
      
      // Extrai Categorias Únicas
      const uniqueCats = Array.from(new Set(productsData.map(p => p.category).filter(Boolean)));
      setCategories(uniqueCats as string[]);

      // Extrai Marcas Únicas
      const uniqueBrands = Array.from(new Set(productsData.map(p => p.brand).filter(Boolean)));
      setBrands(uniqueBrands as string[]);
    }
    
    setLoading(false);
  }

  // --- Funções Auxiliares ---
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !currentState } : c));
    await supabase.from("coupons").update({ active: !currentState }).eq("id", id);
    toast.success(`Cupom ${!currentState ? 'ativado' : 'desativado'}.`);
  };

  const handleDeleteClick = (id: string) => setDeleteConfirmationId(id);

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    const id = deleteConfirmationId;
    setCoupons(prev => prev.filter(c => c.id !== id));
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Cupom excluído.");
    setDeleteConfirmationId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.target_type !== 'all' && !formData.target_id) {
        toast.error("Por favor, selecione o item (Produto, Categoria ou Marca).");
        return;
    }
    setSaving(true);
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("coupons").insert({
            store_id: user?.id,
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            usage_type: formData.usage_type,
            target_type: formData.target_type,
            target_id: formData.target_type !== 'all' ? formData.target_id : null,
            active: true
        });

        if (error) throw error;
        toast.success("Promoção criada com sucesso!");
        setIsModalOpen(false);
        setFormData({ code: "", description: "", discount_type: "percentage", discount_value: "", usage_type: "all", target_type: "all", target_id: "" });
        fetchData();
    } catch (error) {
        console.error(error);
        toast.error("Erro ao criar cupom.");
    } finally {
        setSaving(false);
    }
  };

  // Helper para nome do alvo
  const getTargetLabel = (type: string, id: string) => {
    if (type === 'product') {
        const p = products.find(prod => prod.id === id);
        return p ? p.name : 'Produto desconhecido';
    }
    return id; // Para Categoria e Marca, o ID já é o nome
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Promoções & Cupons</h1>
            <p className="text-zinc-400 text-sm mt-1">Crie códigos de desconto e estratégias de venda.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95">
            <Plus size={18} /> Nova Promoção
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-10">
        {loading ? (
             <div className="col-span-full text-center py-20 text-zinc-500">Carregando promoções...</div>
        ) : coupons.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                <TicketPercent className="mx-auto text-zinc-600 mb-4" size={48} />
                <h3 className="text-zinc-300 font-bold">Nenhum cupom ativo</h3>
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
                                    <button onClick={() => copyToClipboard(coupon.code)} className="text-zinc-500 hover:text-orange-500 transition-colors"><Copy size={14} /></button>
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1">{coupon.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${coupon.active ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} OFF
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {coupon.usage_type === 'first_order' && <span className="badge-blue"><Tag size={10} /> 1ª Compra</span>}
                            {coupon.usage_type === 'partner' && <span className="badge-purple"><Users size={10} /> Parceria</span>}
                            {coupon.usage_type === 'lifetime' && <span className="badge-emerald"><Clock size={10} /> Vitalício</span>}
                            
                            {/* Badge Dinâmica (Categoria, Marca, Produto) */}
                            {coupon.target_type !== 'all' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 truncate max-w-[180px]">
                                    {coupon.target_type === 'product' && <Package size={10} />}
                                    {coupon.target_type === 'category' && <Tag size={10} />}
                                    {coupon.target_type === 'brand' && <Briefcase size={10} />}
                                    
                                    {coupon.target_type === 'brand' && "Marca: "}
                                    {getTargetLabel(coupon.target_type, coupon.target_id)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Status:</span>
                                <button onClick={() => toggleActive(coupon.id, coupon.active)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${coupon.active ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${coupon.active ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <button onClick={() => handleDeleteClick(coupon.id)} className="text-zinc-600 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    {/* Recortes */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-zinc-950 border-r border-zinc-800" />
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-zinc-950 border-l border-zinc-800" />
                </div>
            ))
        )}
      </div>

      {/* --- MODAL DE CRIAÇÃO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h2 className="text-lg font-bold text-white">Criar Nova Promoção</h2>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-zinc-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Código</label>
                            <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="EX: VERAO10" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white font-mono uppercase focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Valor</label>
                            <div className="relative">
                                <input required type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} placeholder="0" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-2.5 pr-8 p-2.5 text-white focus:border-orange-500 outline-none" />
                                <div className="absolute right-2 top-2.5 text-zinc-500">{formData.discount_type === 'percentage' ? <Percent size={16}/> : <DollarSign size={16}/>}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="type" checked={formData.discount_type === 'percentage'} onChange={() => setFormData({...formData, discount_type: 'percentage'})} className="accent-orange-500" />
                            <span className="text-sm text-zinc-300">Porcentagem (%)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="type" checked={formData.discount_type === 'fixed'} onChange={() => setFormData({...formData, discount_type: 'fixed'})} className="accent-orange-500" />
                            <span className="text-sm text-zinc-300">Valor Fixo (R$)</span>
                        </label>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                        <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Desconto em Creatina" className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white focus:border-orange-500 outline-none" />
                    </div>

                    <hr className="border-zinc-800" />

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Campanha</label>
                        <select value={formData.usage_type} onChange={e => setFormData({...formData, usage_type: e.target.value})} className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white focus:border-orange-500 outline-none">
                            <option value="all">Padrão (Para todos)</option>
                            <option value="first_order">Primeira Compra</option>
                            <option value="partner">Parceria / Influencer</option>
                            <option value="lifetime">Vitalício</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Aplicar Desconto em</label>
                        <div className="flex flex-col gap-3">
                             <select value={formData.target_type} onChange={e => setFormData({...formData, target_type: e.target.value, target_id: ""})} className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-white focus:border-orange-500 outline-none">
                                <option value="all">Toda a Loja</option>
                                <option value="category">Categoria Específica</option>
                                <option value="brand">Marca Específica</option>
                                <option value="product">Produto Específico</option>
                            </select>

                            {/* SELETORES INTELIGENTES (COM BUSCA) */}
                            {formData.target_type === 'category' && (
                                <SearchableSelect 
                                    placeholder="Pesquisar Categoria..."
                                    value={formData.target_id}
                                    onChange={(val) => setFormData({...formData, target_id: val})}
                                    options={categories.map(c => ({ value: c, label: c }))}
                                />
                            )}

                            {formData.target_type === 'brand' && (
                                <SearchableSelect 
                                    placeholder="Pesquisar Marca..."
                                    value={formData.target_id}
                                    onChange={(val) => setFormData({...formData, target_id: val})}
                                    options={brands.map(b => ({ value: b, label: b }))}
                                />
                            )}

                            {formData.target_type === 'product' && (
                                <SearchableSelect 
                                    placeholder="Pesquisar Produto..."
                                    value={formData.target_id}
                                    onChange={(val) => setFormData({...formData, target_id: val})}
                                    options={products.map(p => ({ value: p.id, label: p.name, subLabel: p.brand }))}
                                />
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-sm">Cancelar</button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50">
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Criar Promoção
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
                <div className="h-14 w-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><AlertTriangle size={28} /></div>
                <h2 className="text-xl font-bold text-white mb-2">Excluir Cupom?</h2>
                <p className="text-zinc-400 text-sm mb-6">Esta ação não pode ser desfeita. O cupom deixará de funcionar.</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setDeleteConfirmationId(null)} className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-sm w-full">Cancelar</button>
                    <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm w-full shadow-lg shadow-red-900/20">Sim, Excluir</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}