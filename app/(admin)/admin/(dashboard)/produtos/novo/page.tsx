"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  ArrowLeft, Save, Loader2, ScanBarcode, 
  Upload, X, Image as ImageIcon,
  Tag, Box, Palette, CircleDollarSign,
  TrendingUp, Scale
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function NewProductPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [volValue, setVolValue] = useState("");
  const [volUnit, setVolUnit] = useState("g");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    flavor_color: "", 
    barcode: "",
    price: "",
    cost_price: "",
    stock: ""
  });

  // 1. Busca o ID da Loja REAL vinculado ao dono (Evita erro 409)
  useEffect(() => {
    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();
        
        if (store) setStoreId(store.id);
      }
    }
    loadStore();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
          toast.error("A imagem deve ter no máximo 5MB.");
          return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Loja não encontrada. Tente recarregar.");
    
    setIsSaving(true);

    try {
        let finalImageUrl = "";

        // Upload Imagem
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${storeId}/${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        }

        const finalVolume = volValue ? `${volValue}${volUnit}` : "";

        // Payload com store_id corrigido
        const payload = {
            store_id: storeId, // Usando o UUID da loja buscado no useEffect
            name: formData.name,
            category: formData.category || "Geral",
            brand: formData.brand,
            volume: finalVolume,
            flavor_color: formData.flavor_color,
            barcode: formData.barcode,
            price: parseFloat(formData.price.replace(",", ".") || "0"),
            cost_price: parseFloat(formData.cost_price.replace(",", ".") || "0"),
            stock: parseInt(formData.stock || "0"),
            image_url: finalImageUrl,
            active: true
        };

        const { error } = await supabase.from("products").insert(payload);

        if (error) throw error;

        toast.success("Produto cadastrado com sucesso!");
        router.push("/admin/produtos");
        router.refresh();

    } catch (error: any) {
        console.error(error);
        toast.error(`Erro: ${error.message || "Falha ao salvar"}`);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col p-4 md:p-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
            <Link 
                href="/admin/produtos"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Novo Produto</h1>
                <p className="text-zinc-400 text-sm">Adicione um novo item ao seu estoque.</p>
            </div>
        </div>
        
        <button 
            onClick={handleSave} 
            disabled={isSaving || !storeId}
            className="hidden sm:flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Produto
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20 scrollbar-hide">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUNA 1: IMAGEM + ESTOQUE */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase mb-4 w-full text-left flex items-center gap-2">
                        <ImageIcon size={16} className="text-pink-500"/> Foto do Produto
                    </h2>

                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

                    {imagePreview ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-700 group">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            <button 
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-4 transition-all group"
                        >
                            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-all">
                                <Upload size={32} />
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="font-bold text-zinc-300 text-sm">Carregar Imagem</p>
                                <p className="text-[10px] text-zinc-500 font-medium">PNG, JPG ou WEBP (Máx 5MB)</p>
                            </div>
                        </button>
                    )}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-4">
                        <Box size={16} className="text-blue-500"/> Controle de Estoque
                    </h2>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Quantidade Atual</label>
                        <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-center font-mono text-lg" />
                    </div>
                </div>
            </div>

            {/* COLUNA 2: DADOS DO PRODUTO */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2">
                        <Tag size={16} className="text-orange-500"/> Identificação
                    </h2>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome do Produto</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Whey Protein 100% Pure" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Categoria</label>
                            <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Proteínas" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Marca</label>
                            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Ex: Growth" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Scale size={12}/> Volume / Peso</label>
                            <div className="flex">
                                <input type="number" value={volValue} onChange={e => setVolValue(e.target.value)} placeholder="900" className="flex-1 bg-zinc-950 border border-r-0 border-zinc-800 rounded-l-lg p-3 text-white focus:border-orange-500 outline-none" />
                                <select value={volUnit} onChange={e => setVolUnit(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-r-lg px-3 text-xs text-zinc-300 outline-none">
                                    <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="un">un</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Palette size={12}/> Sabor / Variação</label>
                            <input value={formData.flavor_color} onChange={e => setFormData({...formData, flavor_color: e.target.value})} placeholder="Ex: Morango" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Código de Barras</label>
                        <div className="relative">
                            <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Bipe o código..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-white focus:border-orange-500 outline-none font-mono" />
                            <ScanBarcode size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-emerald-500"/> Financeiro
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Preço de Custo</label>
                            <div className="relative">
                                <input type="text" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} placeholder="0,00" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 p-3 text-zinc-400 focus:border-zinc-500 outline-none" />
                                <CircleDollarSign size={14} className="absolute left-2.5 top-4 text-zinc-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-emerald-500 uppercase">Preço de Venda</label>
                            <div className="relative">
                                <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0,00" className="w-full bg-zinc-950 border border-emerald-500/30 rounded-lg pl-8 p-3 text-white focus:border-emerald-500 outline-none font-bold text-lg" />
                                <span className="absolute left-3 top-4 text-emerald-500 text-xs font-bold">R$</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isSaving || !storeId}
                    className="sm:hidden w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Produto
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}