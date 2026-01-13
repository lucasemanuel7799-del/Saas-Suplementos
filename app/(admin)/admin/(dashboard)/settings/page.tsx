"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Store, Save, Camera, Loader2, Copy, Check, Globe, 
  Palette, Clock, CreditCard, Banknote, QrCode, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_PAYMENTS = [
  { id: "pix", label: "Pix Instantâneo", icon: <QrCode size={20} /> },
  { id: "card_machine", label: "Cartão (Maquininha)", icon: <CreditCard size={20} /> },
  { id: "card_link", label: "Pagamento via Link", icon: <LinkIcon size={20} /> },
  { id: "cash", label: "Dinheiro / Espécie", icon: <Banknote size={20} /> },
];

// NOME DO SEU SISTEMA (Para simulação visual)
const SYSTEM_DOMAIN = "quantis.app"; 

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [storeId, setStoreId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState(""); // URL REAL (localhost ou vercel)

  const [formData, setFormData] = useState({
    name: "", slug: "", phone: "", address: "",
    primaryColor: "#18181b", secondaryColor: "#dc2626",
    opensAt: "08:00", closesAt: "22:00",
    paymentMethods: [] as string[]
  });

  const generateSlug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  useEffect(() => {
    async function loadStore() {
      // Pega a URL Real (funcional)
      if (typeof window !== 'undefined') {
          setBaseUrl(window.location.origin);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).single();

      if (data) {
        setStoreId(data.id);
        setLogoUrl(data.logo_url);
        setFormData({
          name: data.name || "", 
          slug: data.slug || "", 
          phone: data.phone || "", 
          address: data.address || "",
          primaryColor: data.primary_color || "#18181b", 
          secondaryColor: data.secondary_color || "#dc2626",
          opensAt: data.opens_at || "08:00", 
          closesAt: data.closes_at || "22:00",
          paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods : []
        });
      }
      setLoading(false);
    }
    loadStore();
  }, []);

  const togglePayment = (id: string) => {
    setFormData(prev => {
      const exists = prev.paymentMethods.includes(id);
      return exists 
        ? { ...prev, paymentMethods: prev.paymentMethods.filter(item => item !== id) }
        : { ...prev, paymentMethods: [...prev.paymentMethods, id] };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileName = `${storeId}-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('store-logos').upload(fileName, file);
      const { data } = supabase.storage.from('store-logos').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      toast.success("Logo atualizada!");
    } catch (error) { 
        console.error(error);
        toast.error("Erro ao subir imagem.");
    } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("stores").update({
          name: formData.name, 
          slug: formData.slug, 
          phone: formData.phone, 
          address: formData.address, 
          logo_url: logoUrl,
          primary_color: formData.primaryColor, 
          secondary_color: formData.secondaryColor,
          opens_at: formData.opensAt, 
          closes_at: formData.closesAt, 
          payment_methods: formData.paymentMethods
        }).eq("id", storeId);

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch { 
        toast.error("Erro ao salvar alterações.");
    } 
    finally { setSaving(false); }
  };

  const copyToClipboard = () => {
    // Copia o link REAL (para funcionar no teste)
    const fullLink = `${baseUrl}/${formData.slug}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado! (Use este para testar)");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-zinc-600"/></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="flex flex-col gap-2 border-b border-zinc-900 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Configurações Gerais</h1>
          <p className="text-zinc-500 text-sm">Gerencie a identidade visual e regras da sua loja.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA - IDENTIDADE E LINK */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="relative group w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-600 transition-all">
                 {uploading ? <Loader2 className="animate-spin text-zinc-500"/> : logoUrl ? <img src={logoUrl} className="w-full h-full object-cover"/> : <Store className="text-zinc-700" size={32}/>}
                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                    <Camera size={20} className="text-white"/>
                 </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Logo da Marca</h3>
                <p className="text-xs text-zinc-500 mt-1">Recomendado: 500x500px</p>
              </div>
            </div>

            {/* CARD DE LINK ATUALIZADO */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 space-y-3">
              <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Link da Loja</label>
              
              <div className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg p-2 transition-colors focus-within:border-zinc-600">
                 <Globe size={14} className="text-zinc-600 shrink-0"/>
                 
                 {/* Container do Link Completo */}
                 <div className="flex items-center w-full min-w-0">
                    {/* AQUI ESTÁ O TRUQUE: Mostramos SYSTEM_DOMAIN visualmente */}
                    <span className="text-zinc-600 text-xs font-mono hidden sm:block truncate select-none">
                        {SYSTEM_DOMAIN}/
                    </span>
                    
                    {/* Input do Slug - Editável */}
                    <input 
                        value={formData.slug} 
                        onChange={e => setFormData({...formData, slug: generateSlug(e.target.value)})} 
                        className="bg-transparent text-xs text-white w-full outline-none font-mono font-bold placeholder:text-zinc-700 ml-0.5"
                        placeholder="nome-da-loja"
                    />
                 </div>

                 <button onClick={copyToClipboard} className="text-zinc-500 hover:text-white transition-colors p-1" title="Copiar link real">
                    {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                 </button>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Este link será: <span className="text-zinc-300">{baseUrl}/{formData.slug}</span> enquanto você estiver testando.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white border-l-2 border-indigo-500 pl-3">Informações da Loja</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Nome Fantasia</label>
                  <input value={formData.name} onChange={e => {
                    const newName = e.target.value;
                    setFormData({...formData, name: newName, slug: generateSlug(newName)});
                  }} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-700" placeholder="Ex: Force Suplementos"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">WhatsApp / Telefone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"/>
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-xs text-zinc-400">Endereço Completo</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700"/>
                </div>
              </div>
            </section>

            <div className="h-px bg-zinc-900 w-full" />

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white border-l-2 border-purple-500 pl-3 flex items-center gap-2">
                Personalização Visual <Palette size={14} className="text-zinc-500"/>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs text-zinc-400">Cor Principal</span>
                      <span className="text-[10px] text-zinc-600 font-mono uppercase">{formData.primaryColor}</span>
                   </div>
                   <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"/>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-xs text-zinc-400">Cor de Destaque</span>
                      <span className="text-[10px] text-zinc-600 font-mono uppercase">{formData.secondaryColor}</span>
                   </div>
                   <input type="color" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"/>
                </div>
              </div>
            </section>

            <div className="h-px bg-zinc-900 w-full" />

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-white border-l-2 border-emerald-500 pl-3">Operação e Pagamentos</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 flex items-center gap-1"><Clock size={12}/> Abertura</label>
                  <input type="time" value={formData.opensAt} onChange={e => setFormData({...formData, opensAt: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none [color-scheme:dark]"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 flex items-center gap-1"><Clock size={12}/> Fechamento</label>
                  <input type="time" value={formData.closesAt} onChange={e => setFormData({...formData, closesAt: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none [color-scheme:dark]"/>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_PAYMENTS.map((method) => {
                  const isSelected = formData.paymentMethods.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      onClick={() => togglePayment(method.id)}
                      className={`relative group p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                        isSelected 
                          ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-100" 
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className={`p-2 rounded-md ${isSelected ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-950 text-zinc-600"}`}>
                        {method.icon}
                      </div>
                      <span className="text-xs font-medium">{method.label}</span>
                      {isSelected && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-900 flex justify-end z-40">
           <div className="max-w-5xl w-full mx-auto flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-zinc-100 hover:bg-white text-black font-medium text-sm py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-zinc-900/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
              Salvar Alterações
            </button>
           </div>
        </div>

      </div>
    </div>
  );
}