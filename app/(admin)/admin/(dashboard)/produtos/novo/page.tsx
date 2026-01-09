"use client";

import { useState, useRef } from "react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Estados separados para Volume (Valor e Unidade)
  const [volValue, setVolValue] = useState("");
  const [volUnit, setVolUnit] = useState("g"); // Padrão gramas

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    brand: "",
    flavor_color: "", 
    barcode: "",
    price: "",      // Preço de Venda
    cost_price: "", // Preço de Custo
    stock: ""
  });

  // Upload de Imagem
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
    setIsSaving(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        let finalImageUrl = "";

        // 1. Upload Imagem
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${user?.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        }

        // 2. Concatena o Volume (Ex: "900" + "g" = "900g")
        const finalVolume = volValue ? `${volValue}${volUnit}` : "";

        // 3. Salva no Banco
        const payload = {
            store_id: user?.id,
            name: formData.name,
            category: formData.category,
            brand: formData.brand,
            volume: finalVolume, // Salva concatenado
            flavor_color: formData.flavor_color,
            barcode: formData.barcode,
            price: parseFloat(formData.price || "0"),
            cost_price: parseFloat(formData.cost_price || "0"), // Novo Campo
            stock: parseInt(formData.stock || "0"),
            image_url: finalImageUrl,
            active: true
        };

        const { error } = await supabase.from("products").insert(payload);

        if (error) throw error;

        toast.success("Produto cadastrado com sucesso!");
        router.push("/admin/produtos");
        router.refresh();

    } catch (error) {
        console.error(error);
        toast.error("Erro ao salvar. Verifique o console.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      
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
            disabled={isSaving}
            className="hidden sm:flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50"
        >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Produto
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20">
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- COLUNA 1: IMAGEM + ESTOQUE --- */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Upload de Imagem */}
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
                                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-lg"
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
                            <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:text-orange-500 group-hover:scale-110 transition-all">
                                <Upload size={32} />
                            </div>
                            <div className="space-y-1 text-center">
                                <p className="font-bold text-zinc-300">Carregar Imagem</p>
                                <p className="text-xs text-zinc-500">Máx 5MB</p>
                            </div>
                        </button>
                    )}
                </div>

                {/* Card de Estoque (Simples e Rápido) */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-4">
                        <Box size={16} className="text-blue-500"/> Controle de Estoque
                    </h2>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Quantidade Atual</label>
                        <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none text-center font-mono text-lg" />
                    </div>
                </div>
            </div>

            {/* --- COLUNA 2: DADOS DO PRODUTO --- */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Dados Principais */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-2">
                        <Tag size={16} className="text-orange-500"/> Identificação
                    </h2>

                    {/* Nome */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Produto</label>
                        <input 
                            required 
                            autoFocus
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="Ex: Whey Protein 100% Pure" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-white focus:border-orange-500 outline-none transition-all placeholder:text-zinc-700" 
                        />
                    </div>

                    {/* Linha: Categoria & Marca */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                            <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Proteínas" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Marca</label>
                            <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Ex: Growth" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>

                    {/* Linha: Volume & Sabor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* VOLUME (INPUT GROUP) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                                <Scale size={12}/> Volume / Peso
                            </label>
                            <div className="flex">
                                <input 
                                    type="number"
                                    value={volValue} 
                                    onChange={e => setVolValue(e.target.value)} 
                                    placeholder="900" 
                                    className="flex-1 bg-zinc-950 border border-r-0 border-zinc-800 rounded-l-lg p-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" 
                                />
                                <select 
                                    value={volUnit}
                                    onChange={e => setVolUnit(e.target.value)}
                                    className="bg-zinc-900 border border-l-zinc-800 border-zinc-800 rounded-r-lg px-3 text-sm text-zinc-300 focus:border-orange-500 outline-none cursor-pointer hover:bg-zinc-800"
                                >
                                    <option value="g">g (Gramas)</option>
                                    <option value="kg">kg (Quilos)</option>
                                    <option value="ml">ml (Mili)</option>
                                    <option value="L">L (Litros)</option>
                                    <option value="un">un (Unid)</option>
                                    <option value="cps">cps (Cáps)</option>
                                    <option value="kit">Kit</option>
                                </select>
                            </div>
                        </div>

                        {/* SABOR / COR */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                                <Palette size={12}/> Sabor / Cor / Variação
                            </label>
                            <input 
                                value={formData.flavor_color} 
                                onChange={e => setFormData({...formData, flavor_color: e.target.value})} 
                                placeholder="Ex: Morango, Preto, G..." 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-orange-500 outline-none" 
                            />
                        </div>
                    </div>

                    {/* Código de Barras */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Código de Barras (EAN)</label>
                        <div className="relative">
                            <input 
                                value={formData.barcode} 
                                onChange={e => setFormData({...formData, barcode: e.target.value})} 
                                placeholder="Bipe o código aqui..." 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-white focus:border-orange-500 outline-none font-mono tracking-widest" 
                            />
                            <ScanBarcode size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                        </div>
                    </div>
                </div>

                {/* 2. Financeiro (Precificação) */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-sm font-bold text-zinc-300 uppercase flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-emerald-500"/> Precificação & Custos
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                        {/* Preço de Custo */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Preço de Custo</label>
                            <div className="relative group">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.cost_price} 
                                    onChange={e => setFormData({...formData, cost_price: e.target.value})} 
                                    placeholder="0.00" 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-3 text-zinc-300 focus:border-zinc-500 outline-none transition-colors" 
                                />
                                <CircleDollarSign size={16} className="absolute left-2.5 top-3.5 text-zinc-600 group-focus-within:text-zinc-400" />
                            </div>
                            <p className="text-[10px] text-zinc-600">Usado para calcular lucro.</p>
                        </div>

                        {/* Preço de Venda (Destaque) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-500 uppercase">Preço de Venda</label>
                            <div className="relative group">
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})} 
                                    placeholder="0.00" 
                                    className="w-full bg-zinc-950 border border-emerald-500/30 rounded-lg pl-8 pr-3 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                                />
                                <span className="absolute left-3 top-4 text-emerald-500 text-xs font-bold">R$</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão Salvar Mobile */}
                <div className="block sm:hidden">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Salvar Produto
                    </button>
                </div>

            </div>
        </form>
      </div>
    </div>
  );
}