"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  ArrowLeft, Save, Loader2, ScanBarcode, 
  Upload, X, Image as ImageIcon,
  Tag, Box, Palette, CircleDollarSign,
  TrendingUp, Scale, Trash2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);
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
    stock: "",
    image_url: "" 
  });

  // --- 1. BUSCAR DADOS DA LOJA E DO PRODUTO ---
  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Primeiro busca a loja do dono
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!store) {
        toast.error("Loja não encontrada.");
        return;
      }
      setStoreId(store.id);

      // Agora busca o produto garantindo que pertença a esta loja
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("store_id", store.id) // PROTEÇÃO: Só edita se for o dono
        .maybeSingle();

      if (error || !data) {
        toast.error("Produto não encontrado ou acesso negado.");
        router.push("/admin/produtos");
        return;
      }

      setFormData({
        name: data.name || "",
        category: data.category || "",
        brand: data.brand || "",
        flavor_color: data.flavor_color || "",
        barcode: data.barcode || "",
        price: data.price ? String(data.price) : "",
        cost_price: data.cost_price ? String(data.cost_price) : "",
        stock: data.stock ? String(data.stock) : "0",
        image_url: data.image_url || ""
      });

      if (data.image_url) setImagePreview(data.image_url);

      if (data.volume) {
        const match = data.volume.match(/^(\d+)(.*)$/);
        if (match) {
           setVolValue(match[1]);
           setVolUnit(match[2] || "g");
        } else {
           setVolUnit(data.volume);
        }
      }

      setIsLoadingData(false);
    }

    loadInitialData();
  }, [id, router, supabase]);

  // --- 2. MANIPULAÇÃO DE IMAGEM ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Máx 5MB.");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 3. EXCLUIR PRODUTO ---
  const handleDelete = async () => {
    if (!confirm("Excluir permanentemente?")) return;
    try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        toast.success("Produto excluído.");
        router.push("/admin/produtos");
        router.refresh();
    } catch (error) {
        toast.error("Erro ao excluir.");
    }
  };

  // --- 4. SALVAR ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Loja não identificada.");
    setIsSaving(true);

    try {
        let finalImageUrl = formData.image_url;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${storeId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        } else if (!imagePreview) {
            finalImageUrl = "";
        }

        const finalVolume = volValue ? `${volValue}${volUnit}` : (volUnit === 'kit' ? 'Kit' : "");

        const payload = {
            name: formData.name,
            category: formData.category,
            brand: formData.brand,
            volume: finalVolume,
            flavor_color: formData.flavor_color,
            barcode: formData.barcode,
            price: parseFloat(formData.price.replace(",", ".") || "0"),
            cost_price: parseFloat(formData.cost_price.replace(",", ".") || "0"),
            stock: parseInt(formData.stock || "0"),
            image_url: finalImageUrl
        };

        const { error } = await supabase
            .from("products")
            .update(payload)
            .eq("id", id)
            .eq("store_id", storeId); // Segurança extra no update

        if (error) throw error;

        toast.success("Produto atualizado!");
        router.push("/admin/produtos");
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Erro ao atualizar.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoadingData) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-orange-600" size={40} />
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col p-4 md:p-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
            <Link 
                href="/admin/produtos"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Editar Produto</h1>
                <p className="text-zinc-400 text-sm">Atualize os detalhes do item.</p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button type="button" onClick={handleDelete} className="hidden sm:flex items-center justify-center w-10 h-10 bg-zinc-900 text-zinc-500 hover:text-red-500 rounded-xl border border-zinc-800 transition-all">
                <Trash2 size={20} />
            </button>
            <button onClick={handleSave} disabled={isSaving} className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar Alterações
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20 scrollbar-hide">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase mb-4 w-full text-left flex items-center gap-2 text-[10px]">
                        <ImageIcon size={16} className="text-pink-500"/> Foto do Produto
                    </h2>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    {imagePreview ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-700 group">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-square border-2 border-dashed border-zinc-700 hover:border-orange-500 hover:bg-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-4 transition-all group">
                            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-all"><Upload size={32} /></div>
                            <p className="font-bold text-zinc-300 text-xs text-center">Adicionar Imagem</p>
                        </button>
                    )}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 text-[10px] mb-4">
                        <Box size={16} className="text-blue-500"/> Controle de Estoque
                    </h2>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Quantidade Atual</label>
                        <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-center font-mono text-lg" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 text-[10px]">
                        <Tag size={16} className="text-orange-500"/> Identificação
                    </h2>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome do Produto</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-white focus:border-orange-500 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Categoria</label>
                            <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Marca</label>
                            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Scale size={12}/> Volume / Peso</label>
                            <div className="flex">
                                <input type="number" value={volValue} onChange={e => setVolValue(e.target.value)} className="flex-1 bg-zinc-950 border border-r-0 border-zinc-800 rounded-l-lg p-3 text-white focus:border-orange-500 outline-none" />
                                <select value={volUnit} onChange={e => setVolUnit(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-r-lg px-3 text-xs text-zinc-300 outline-none">
                                    <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="un">un</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><Palette size={12}/> Sabor / Variação</label>
                            <input value={formData.flavor_color} onChange={e => setFormData({...formData, flavor_color: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Código de Barras</label>
                        <div className="relative">
                            <input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-white focus:border-orange-500 outline-none font-mono" />
                            <ScanBarcode size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-4 text-[10px]">
                        <TrendingUp size={16} className="text-emerald-500"/> Precificação & Custos
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Preço de Custo</label>
                            <div className="relative">
                                <input type="text" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 p-3 text-zinc-400 focus:border-zinc-500 outline-none" />
                                <CircleDollarSign size={14} className="absolute left-2.5 top-4 text-zinc-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-emerald-500 uppercase">Preço de Venda</label>
                            <div className="relative">
                                <input required type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-950 border border-emerald-500/30 rounded-lg pl-8 p-3 text-white focus:border-emerald-500 outline-none font-bold text-lg" />
                                <span className="absolute left-3 top-4 text-emerald-500 text-xs font-bold">R$</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sm:hidden grid grid-cols-4 gap-2">
                    <button type="button" onClick={handleDelete} className="bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl flex items-center justify-center"><Trash2 size={20} /></button>
                    <button onClick={handleSave} disabled={isSaving} className="col-span-3 bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Salvar Alterações"}
                    </button>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}