"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useParams } from "next/navigation"; // useParams para pegar o ID da URL
import { 
  ArrowLeft, Loader2, Save, UploadCloud, 
  Image as ImageIcon, Plus, X, DollarSign, Tag, Box, Palette 
} from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams(); // Pega o ID da rota (/[id])
  const productId = params.id as string;
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true); // Começa carregando
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  // --- ESTADOS ---
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [flavor, setFlavor] = useState("");
  
  // Categoria
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  // Specs
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");

  // Financeiro
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  
  // Imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // URL que veio do banco

  // 1. CARREGAR DADOS DO PRODUTO E DA LOJA
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // A. Pega ID da Loja
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!store) {
          router.push("/admin/login");
          return;
        }
        setStoreId(store.id);

        // B. Pega categorias existentes (para o select)
        const { data: productsCats } = await supabase.from("products").select("category").eq("store_id", store.id);
        if (productsCats) {
          const uniqueCats = Array.from(new Set(productsCats.map(p => p.category).filter(Boolean)));
          setExistingCategories(uniqueCats);
        }

        // C. PEGA O PRODUTO ATUAL
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("store_id", store.id) // Segurança extra: garante que é da loja dele
          .single();

        if (error || !product) {
          alert("Produto não encontrado.");
          router.push("/admin/produtos");
          return;
        }

        // D. Preenche os campos
        setName(product.name);
        setBrand(product.brand || "");
        setFlavor(product.flavor || "");
        setCategory(product.category || "");
        setWeight(product.weight ? product.weight.toString() : "");
        setWeightUnit(product.weight_unit || "g");
        setPrice(product.price.toString());
        setCostPrice(product.cost_price ? product.cost_price.toString() : "");
        setStock(product.stock.toString());
        setDescription(product.description || "");
        
        if (product.image_url) {
          setPreviewUrl(product.image_url);
          setCurrentImageUrl(product.image_url);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false); // Fim do carregamento inicial
      }
    }
    loadData();
  }, [productId, supabase, router]);

  // Imagem Select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- AÇÃO DE ATUALIZAR (UPDATE) ---
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return;

    setSaving(true);

    try {
      let finalImageUrl = currentImageUrl; // Por padrão, mantém a antiga

      // Se o usuário selecionou uma NOVA imagem, faz upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${storeId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      } else if (previewUrl === null) {
        // Se o usuário removeu a imagem (preview é null), limpa no banco
        finalImageUrl = null;
      }

      const numericPrice = parseFloat(price.replace(",", "."));
      const numericCost = parseFloat(costPrice.replace(",", "."));
      const numericWeight = parseFloat(weight.replace(",", "."));
      const numericStock = parseInt(stock);
      const finalCategory = isCreatingCategory ? customCategory : category;

      // UPDATE no banco
      const { error } = await supabase
        .from("products")
        .update({
          name,
          brand,
          flavor,
          category: finalCategory,
          weight: isNaN(numericWeight) ? null : numericWeight,
          weight_unit: weightUnit,
          price: isNaN(numericPrice) ? 0 : numericPrice,
          cost_price: isNaN(numericCost) ? 0 : numericCost,
          stock: isNaN(numericStock) ? 0 : numericStock,
          description,
          image_url: finalImageUrl,
        })
        .eq("id", productId); // WHERE id = produto_atual

      if (error) throw error;
      
      router.push("/admin/produtos");
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Styles
  const labelStyle = "text-[11px] font-bold text-zinc-500 uppercase mb-1.5 block tracking-wide";
  const inputStyle = "h-11 w-full rounded-lg border border-zinc-800 bg-black/50 px-3 text-white focus:border-blue-600 focus:outline-none transition-all placeholder:text-zinc-700 text-sm";
  const cardStyle = "rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm";

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/produtos" className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Editar Produto</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Atualize as informações do item.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === COLUNA ESQUERDA === */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* FOTO */}
          <div className={cardStyle}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-sm">
                 <ImageIcon size={16} className="text-blue-500" /> Mídia
               </h3>
               {previewUrl && (
                 <button onClick={() => {setPreviewUrl(null); setImageFile(null)}} className="text-xs text-red-400 hover:text-red-300">Remover</button>
               )}
            </div>
            
            <div 
              className={`aspect-square w-full rounded-lg border-2 border-dashed transition-all group relative overflow-hidden cursor-pointer ${previewUrl ? 'border-zinc-800 bg-black' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-blue-500/50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <UploadCloud size={24} className="text-white mb-2"/>
                    <span className="text-xs font-bold text-white">Alterar Imagem</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
                  <div className="bg-zinc-800 p-3 rounded-full group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-zinc-300">Clique para enviar</p>
                    <p className="text-[10px] uppercase tracking-wide mt-1">JPG, PNG, WebP</p>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>
          </div>

          {/* INVENTÁRIO */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <h3 className="font-bold text-zinc-100 mb-3 text-sm flex items-center gap-2">
              <Box size={16} className="text-blue-500" /> Estoque
            </h3>
            <div>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputStyle}
                placeholder="0"
              />
              <div className="mt-2 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${parseInt(stock) > 0 ? 'bg-green-500' : 'bg-zinc-700'}`} 
                  style={{width: parseInt(stock) > 0 ? '100%' : '0%'}}
                ></div>
              </div>
            </div>
          </div>

          {/* BOTÃO SALVAR ALTERAÇÕES */}
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-900/20 text-sm mt-auto"
          >
            {saving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20} /> Salvar Alterações</>}
          </button>

        </div>

        {/* === COLUNA DIREITA === */}
        <div className="lg:col-span-8 space-y-6">

          {/* GERAL */}
          <div className={cardStyle}>
            <h3 className="font-bold text-zinc-100 mb-6 pb-4 border-b border-zinc-800 text-sm flex items-center gap-2">
              <Tag size={16} className="text-blue-500" /> Informações Gerais
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Nome do Produto</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Categoria */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Categoria</label>
                    <button 
                      type="button"
                      onClick={() => { setIsCreatingCategory(!isCreatingCategory); setCustomCategory(""); }}
                      className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${isCreatingCategory ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'}`}
                    >
                      {isCreatingCategory ? <><X size={10}/> Cancelar</> : <><Plus size={10}/> Nova</>}
                    </button>
                  </div>
                  
                  {isCreatingCategory ? (
                    <input
                      type="text"
                      autoFocus
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className={`${inputStyle} border-blue-500/50 bg-blue-900/10 text-blue-100 focus:border-blue-500`}
                      placeholder="Nova categoria..."
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`${inputStyle} appearance-none`}
                    >
                      <option value="" disabled>Selecione...</option>
                      {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="Geral">Geral</option>
                      <option value="Suplementos">Suplementos</option>
                      <option value="Vitaminas">Vitaminas</option>
                    </select>
                  )}
                </div>

                {/* Marca */}
                <div>
                  <label className={labelStyle}>Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputStyle}
                  />
                </div>

                {/* Sabor */}
                <div>
                  <label className={labelStyle}>Sabor / Cor</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={flavor}
                      onChange={(e) => setFlavor(e.target.value)}
                      className={`${inputStyle} pl-9`}
                    />
                    <Palette size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ESPECIFICAÇÕES */}
          <div className={cardStyle}>
             <h3 className="font-bold text-zinc-100 mb-6 pb-4 border-b border-zinc-800 text-sm">Especificações</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                 <label className={labelStyle}>Peso / Volume Líquido</label>
                 <div className="flex">
                   <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="h-11 flex-1 rounded-l-lg border border-zinc-800 bg-black/50 px-3 text-white focus:border-blue-600 focus:outline-none focus:z-10 text-sm border-r-0 placeholder:text-zinc-700"
                   />
                   <div className="h-11 w-px bg-zinc-800"></div>
                   <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      className="h-11 w-24 rounded-r-lg border border-zinc-800 bg-zinc-800 px-3 text-white focus:border-blue-600 focus:outline-none cursor-pointer hover:bg-zinc-700 text-sm"
                   >
                     <option value="g">g</option>
                     <option value="kg">kg</option>
                     <option value="ml">ml</option>
                     <option value="L">L</option>
                     <option value="uni">un</option>
                   </select>
                 </div>
               </div>

               <div>
                  <label className={labelStyle}>Descrição Rápida</label>
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputStyle}
                  />
               </div>
             </div>
          </div>

          {/* FINANCEIRO */}
          <div className={cardStyle}>
            <h3 className="font-bold text-zinc-100 mb-6 pb-4 border-b border-zinc-800 text-sm">Financeiro</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle}>Custo de Aquisição</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-zinc-500 text-sm font-medium">R$</span>
                  </div>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className={`${inputStyle} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-green-400 uppercase mb-1.5 block tracking-wide flex items-center gap-1">
                  <DollarSign size={10}/> Valor de Venda
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-green-500 text-sm font-bold">R$</span>
                  </div>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11 w-full rounded-lg border border-green-500/30 bg-green-500/5 px-3 pl-10 text-white focus:border-green-500 focus:outline-none transition-all placeholder:text-zinc-700 text-sm font-bold"
                  />
                </div>
              </div>
            </div>
            
            {price && costPrice && (
              <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Lucro Estimado:</span>
                <span className="font-mono text-green-400">
                  R$ {(parseFloat(price.replace(",", ".")) - parseFloat(costPrice.replace(",", "."))).toFixed(2)} / un
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}