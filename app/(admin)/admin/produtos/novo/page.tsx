"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, LayoutGrid, DollarSign, Package, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- ESTADOS ---
  const [name, setName] = useState("");
  const [flavor, setFlavor] = useState(""); 
  const [weightValue, setWeightValue] = useState(""); 
  const [weightUnit, setWeightUnit] = useState("g");  
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(""); 
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. PEGAR USUÁRIO E STORE_ID MULTI-LOJA
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Usuário não autenticado");
      const store_id = user.user_metadata?.store_id;
      if (!store_id) throw new Error("Store_id não encontrado no usuário. Faça login ou selecione uma loja.");

      let imageUrl = null;

      // 2. Upload da imagem
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, imageFile);
        if (uploadError) throw new Error(`Erro Upload: ${uploadError.message}`);
        const { data } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // 3. INSERIR produto COM store_id correto
      const { error: insertError } = await supabase.from("products").insert({
        store_id, // <-- só essa linha foi adicionada obrigatoriamente!
        name,
        price: parseFloat(price.replace(",", ".")) || 0,
        cost_price: parseFloat(costPrice.replace(",", ".")) || 0,
        category,
        brand: brand || null,
        flavor: flavor || null,
        volume: weightValue ? `${weightValue}${weightUnit}` : null,
        image_url: imageUrl,
        // stock: parseInt(stock) || 0
      });

      if (insertError) throw insertError;

      router.push("/admin");
      router.refresh();

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black p-8 text-zinc-100 flex justify-center">
      
      <div className="w-full max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin" className="rounded-lg bg-zinc-900/50 p-2 hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} className="text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Produto</h1>
            <p className="text-sm text-zinc-400">Preencha as informações do item.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* === COLUNA ESQUERDA (1/3) === */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            
            {/* CARD IMAGEM */}
            <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 h-[340px] flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-zinc-400">
                <ImageIcon size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Imagem</span>
              </div>
              
              <label className="flex-1 relative cursor-pointer flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/20 hover:border-blue-500 hover:bg-zinc-900/50 transition-all group overflow-hidden">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-500 group-hover:text-blue-500">
                    <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-blue-500/10 transition-colors">
                      <Upload size={24} />
                    </div>
                    <span className="text-sm font-medium">Clique para enviar</span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            </div>

            {/* CARD ORGANIZAÇÃO */}
            <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <LayoutGrid size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Organização</span>
              </div>

              <div className="space-y-5 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                  <input
                    type="text"
                    list="categories"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Proteínas"
                    className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                  <datalist id="categories">
                    <option value="Proteínas" />
                    <option value="Creatinas" />
                    <option value="Pré-treino" />
                    <option value="Vitaminas" />
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Growth"
                    className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* === COLUNA DIREITA (2/3) === */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            
            {/* CARD DETALHES */}
            <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 h-[340px] flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <Package size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">Detalhes</span>
              </div>

              <div className="space-y-5 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Whey Protein Concentrado"
                    className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-base text-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Variação (Sabor/Cor)</label>
                    <input
                      type="text"
                      value={flavor}
                      onChange={(e) => setFlavor(e.target.value)}
                      placeholder="Ex: Morango"
                      className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="col-span-4 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Peso/Vol</label>
                    <input
                      type="number"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      placeholder="900"
                      className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Unid.</label>
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-2 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none cursor-pointer"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="cps">cps</option>
                      <option value="un">un</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD FINANCEIRO */}
            <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 text-zinc-400">
                  <DollarSign size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Financeiro</span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Preço Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-lg font-medium text-zinc-400 focus:border-blue-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-400 uppercase">Preço Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-lg font-medium text-white focus:border-blue-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Estoque</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full h-12 rounded-lg border border-zinc-800 bg-black px-4 text-sm text-zinc-200 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 h-12 font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>
                      <Save size={18} />
                      Salvar Produto
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}