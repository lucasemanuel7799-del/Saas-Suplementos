"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  ArrowLeft, Save, Loader2, ScanBarcode, Upload, X, Image as ImageIcon,
  Tag, Box, Search, Plus, Trash2, PackagePlus, TrendingUp
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function NewKitPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Dados do Kit
  const [formData, setFormData] = useState({
    name: "",
    category: "Kits",
    barcode: "",
    price: "",
    stock: "",
  });

  // Itens do Kit
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // 1. Busca de Produtos (Debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
        if (searchTerm.length > 1) {
            const { data: { user } } = await supabase.auth.getUser();
            const { data } = await supabase
                .from("products")
                .select("id, name, image_url, price, cost_price")
                .eq("store_id", user?.id)
                .ilike("name", `%${searchTerm}%`)
                .eq("active", true)
                .eq("is_kit", false) // Evita kit dentro de kit
                .limit(5);
            setSearchResults(data || []);
        } else {
            setSearchResults([]);
        }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // 2. Lógica de Itens
  const addItemToKit = (product: any) => {
    const exists = selectedItems.find(i => i.id === product.id);
    if (exists) {
        toast.info("Este item já está no kit.");
        return;
    }
    setSelectedItems(prev => [...prev, { ...product, quantity: 1 }]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeItem = (id: number) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty };
        }
        return item;
    }));
  };

  // 3. Cálculos
  // Custo Total = Soma de (Custo do Item * Quantidade)
  const totalCost = selectedItems.reduce((acc, item) => acc + (item.cost_price || 0) * item.quantity, 0);

  // Upload Imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Máx 5MB");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return toast.error("Adicione produtos ao kit.");
    setIsSaving(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        let finalImageUrl = "";

        // Upload
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `kits/${Date.now()}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(user?.id + '/' + fileName, imageFile);
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(user?.id + '/' + fileName);
                finalImageUrl = publicUrl;
            }
        }

        // Criar Produto Pai (Kit)
        const productPayload = {
            store_id: user?.id,
            name: formData.name,
            category: formData.category,
            barcode: formData.barcode,
            price: parseFloat(formData.price || "0"),
            stock: parseInt(formData.stock || "0"),
            cost_price: totalCost, // Salva o custo calculado automaticamente
            image_url: finalImageUrl,
            active: true,
            is_kit: true 
        };

        const { data: newKit, error: kitError } = await supabase
            .from("products")
            .insert(productPayload)
            .select()
            .single();

        if (kitError) throw kitError;

        // Salvar Itens Filhos
        const kitItemsPayload = selectedItems.map(item => ({
            kit_id: newKit.id,
            product_id: item.id,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase.from("kit_items").insert(kitItemsPayload);
        if (itemsError) throw itemsError;

        toast.success("Kit criado com sucesso!");
        router.push("/admin/produtos");
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Erro ao criar kit.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
            <Link href="/admin/produtos" className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Novo Kit / Combo</h1>
                <p className="text-zinc-400 text-sm">Crie agrupamentos de produtos para aumentar o ticket médio.</p>
            </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="hidden sm:flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Kit
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- COLUNA 1: IMAGEM + DADOS DE VENDA --- */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Upload Foto */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase mb-4 w-full text-left flex items-center gap-2">
                        <ImageIcon size={16} className="text-pink-500"/> Capa do Kit
                    </h2>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    {imagePreview ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-700 group">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-4 transition-all group">
                            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:text-purple-500 group-hover:scale-110 transition-all"><Upload size={32} /></div>
                            <div className="space-y-1 text-center"><p className="font-bold text-zinc-300">Carregar Imagem</p></div>
                        </button>
                    )}
                </div>

                {/* Preço e Estoque */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                        <Tag size={16} className="text-emerald-500"/> Dados de Venda
                    </h2>
                    <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Estoque (Qtd de Kits)</label>
                            <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono text-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-500 uppercase">Preço Final (R$)</label>
                            <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full bg-zinc-950 border border-emerald-500/30 rounded-lg p-3 text-white focus:border-emerald-500 outline-none font-bold text-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- COLUNA 2: INFO + COMPOSIÇÃO --- */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Identificação */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                        <PackagePlus size={16} className="text-purple-500"/> Identificação
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Kit</label>
                            <input required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Kit Hipertrofia Max" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-white focus:border-purple-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                            <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Código de Barras (Opcional)</label>
                            <div className="relative">
                                <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="EAN do Kit..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-3 text-white focus:border-purple-500 outline-none font-mono" />
                                <ScanBarcode size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. COMPOSIÇÃO (Itens) */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 min-h-[400px]">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                            <Box size={16} className="text-orange-500"/> Itens do Kit
                        </h2>
                        {/* Custo Automático */}
                        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <TrendingUp size={14} />
                            Custo Calculado: <span className="text-white font-bold">R$ {totalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Busca de Produtos */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Pesquise produtos para adicionar..." 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-orange-500 outline-none placeholder:text-zinc-600"
                        />
                        {/* Dropdown de Resultados */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                                {searchResults.map(prod => (
                                    <button 
                                        key={prod.id} 
                                        type="button"
                                        onClick={() => addItemToKit(prod)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 text-left transition-colors border-b border-zinc-800 last:border-0"
                                    >
                                        <div className="h-10 w-10 bg-zinc-950 rounded border border-zinc-800 relative overflow-hidden shrink-0">
                                            {prod.image_url && <Image src={prod.image_url} alt="" fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{prod.name}</p>
                                            <p className="text-xs text-zinc-500">Custo: R$ {prod.cost_price?.toFixed(2)}</p>
                                        </div>
                                        <Plus size={18} className="text-orange-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lista de Selecionados */}
                    <div className="space-y-3">
                        {selectedItems.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600">
                                <PackagePlus size={40} className="mx-auto mb-2 opacity-50"/>
                                <p className="text-sm">Nenhum item adicionado ainda.</p>
                                <p className="text-xs">Use a busca acima para montar o kit.</p>
                            </div>
                        ) : (
                            selectedItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                    <div className="h-12 w-12 bg-zinc-900 rounded-lg relative overflow-hidden shrink-0 border border-zinc-800">
                                         {item.image_url && <Image src={item.image_url} alt="" fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-sm">{item.name}</p>
                                        <p className="text-xs text-zinc-500">Custo Unit: R$ {item.cost_price?.toFixed(2)}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-xs font-bold">-</button>
                                        <span className="text-xs font-bold w-6 text-center text-white">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-bold">+</button>
                                    </div>

                                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* Botão Salvar Mobile */}
                <div className="block sm:hidden">
                    <button onClick={handleSave} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-xl font-bold transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Salvar Kit
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}