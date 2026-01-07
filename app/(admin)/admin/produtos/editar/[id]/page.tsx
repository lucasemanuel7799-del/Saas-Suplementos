"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Box, DollarSign, Image as ImageIcon, LayoutList, Loader2, Save, Trash2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const params = useParams(); // Pega o ID da URL
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Carregando dados iniciais
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    flavor_color: "",
    weight_value: "",
    weight_unit: "g",
    cost_price: "",
    price: "",
    stock: "",
    image_url: "",
  });

  // 1. Buscar os dados do produto ao abrir a página
  useEffect(() => {
    async function fetchProduct() {
      if (!params.id) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        alert("Erro ao buscar produto.");
        router.push("/admin/produtos");
        return;
      }

      // Preenche o formulário com os dados que vieram do banco
      if (data) {
        setFormData({
            name: data.name,
            brand: data.brand || "",
            category: data.category || "",
            flavor_color: data.flavor_color || "",
            weight_value: data.weight_volume ? data.weight_volume.replace(/[a-zA-Z]/g, '') : "", // Tenta separar número da letra
            weight_unit: data.weight_volume ? data.weight_volume.replace(/[0-9.]/g, '') : "g", // Pega só a letra
            cost_price: data.cost_price?.toString() || "",
            price: data.price?.toString() || "",
            stock: data.stock?.toString() || "",
            image_url: data.image_url || "",
        });
        
        if (data.image_url) {
            setPreviewUrl(data.image_url);
        }
      }
      setFetching(false);
    }

    fetchProduct();
  }, [params.id, router]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;

      // Se o usuário trocou a imagem, fazemos upload da nova
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }

      // Atualizar no Banco (UPDATE em vez de INSERT)
      const { error } = await supabase
        .from("products")
        .update({
            name: formData.name,
            brand: formData.brand,
            category: formData.category,
            flavor_color: formData.flavor_color,
            weight_volume: formData.weight_value ? `${formData.weight_value}${formData.weight_unit}` : null,
            cost_price: parseFloat(formData.cost_price.replace(",", ".")) || 0,
            price: parseFloat(formData.price.replace(",", ".")) || 0,
            stock: parseInt(formData.stock) || 0,
            image_url: finalImageUrl,
        })
        .eq("id", params.id); // MUITO IMPORTANTE: Só atualiza esse ID

      if (error) throw error;

      router.push("/admin/produtos");
      router.refresh();

    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return (
          <div className="flex h-screen items-center justify-center text-white">
              <Loader2 className="animate-spin mr-2" /> Carregando produto...
          </div>
      )
  }

  return (
    <div className="mx-auto max-w-6xl pb-20">
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/admin/produtos">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ArrowLeft size={24} />
            </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-white">Editar Produto</h1>
                <p className="text-zinc-400">Alterar informações de {formData.name}</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* LINHA 1 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            
            {/* Imagem */}
            <div className="md:col-span-4 flex flex-col h-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 font-bold text-xs uppercase tracking-wider text-zinc-400">Imagem</h3>
                <div className="flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950 hover:bg-zinc-900 transition relative overflow-hidden group cursor-pointer min-h-[200px]">
                    <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        onChange={handleImageChange}
                    />
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" fill className="object-contain p-2 z-10" />
                    ) : (
                        <div className="text-center space-y-2">
                            <UploadCloud className="mx-auto text-zinc-500" />
                            <span className="text-xs text-zinc-500">Clique para trocar</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Detalhes */}
            <div className="md:col-span-8 flex flex-col h-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 font-bold text-xs uppercase tracking-wider text-zinc-400">Detalhes</h3>
                <div className="flex flex-col gap-4 h-full">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Nome</label>
                        <input name="name" required value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-blue-600 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Variação</label>
                            <input name="flavor_color" value={formData.flavor_color} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-blue-600 focus:outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Peso</label>
                                <input name="weight_value" value={formData.weight_value} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-blue-600 focus:outline-none" />
                            </div>
                            <select name="weight_unit" value={formData.weight_unit} onChange={handleChange} className="w-24 mt-6 rounded-lg border border-zinc-800 bg-black px-2 text-white focus:border-blue-600 focus:outline-none appearance-none">
                                <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="un">un</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* LINHA 2 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            
            {/* Organização */}
            <div className="md:col-span-4 flex flex-col h-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 font-bold text-xs uppercase tracking-wider text-zinc-400">Organização</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                        <input name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-purple-600 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Marca</label>
                        <input name="brand" value={formData.brand} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-purple-600 focus:outline-none" />
                    </div>
                </div>
            </div>

            {/* Financeiro */}
            <div className="md:col-span-8 flex flex-col h-full rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-4 font-bold text-xs uppercase tracking-wider text-zinc-400">Financeiro</h3>
                <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Custo (R$)</label>
                        <input name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-green-600 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-blue-400 uppercase">Venda (R$)</label>
                        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-blue-900/30 bg-black px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Estoque</label>
                        <input name="stock" type="number" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border border-zinc-800 bg-black px-4 py-3 text-white focus:border-green-600 focus:outline-none" />
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" disabled={loading} className="h-[50px] w-full bg-blue-600 text-base font-bold hover:bg-blue-500">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>
        </div>

      </form>
    </div>
  );
}