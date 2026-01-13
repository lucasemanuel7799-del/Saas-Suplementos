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

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [storeId, setStoreId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  const [formData, setFormData] = useState({
    name: "", slug: "", phone: "", address: "",
    primaryColor: "#18181b", secondaryColor: "#dc2626",
    opensAt: "08:00", closesAt: "22:00",
    paymentMethods: [] as string[]
  });

  // Função que limpa o texto para virar link (Ex: "Loja do Zé" -> "loja-do-ze")
  const generateSlug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }

    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).single();

      if (data) {
        setStoreId(data.id);
        setLogoUrl(data.logo_url);
        
        // AQUI: Forçamos o carregamento do slug que está no banco
        setFormData({
          name: data.name || "", 
          slug: data.slug || generateSlug(data.name || ""), // Se não tiver slug, gera pelo nome
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
          slug: formData.slug, // Salva o novo slug no banco
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
      toast.success("Configurações salvas!");
    } catch { 
        toast.error("Erro ao salvar.");
    } 
    finally { setSaving(false); }
  };

  const copyToClipboard = () => {
    const fullLink = `${baseUrl}/${formData.slug}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-zinc-600"/></div>;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto pb-32">
        
        <div className="flex flex-col gap-2 border-b border-zinc-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configurações da Loja</h1>
          <p className="text-zinc-500">Personalize sua marca e dados de contato.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUNA ESQUERDA - IDENTIDADE E LINK */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* LOGO */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="relative group w-32 h-32 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-400 transition-all">
                 {uploading ? <Loader2 className="animate-spin text-zinc-500"/> : logoUrl ? <img src={logoUrl} className="w-full h-full object-cover"/> : <Store className="text-zinc-400" size={32}/>}
                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                    <Camera size={20} className="text-white"/>
                 </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Logo da Marca</h3>
                <p className="text-xs text-zinc-500 mt-1">Clique para alterar</p>
              </div>
            </div>

            {/* LINK DA LOJA */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Link Público</label>
              
              <div className="flex items-center gap-2 bg-white border border-zinc-300 rounded-lg p-2.5 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-transparent transition-all">
                 <Globe size={16} className="text-zinc-400 shrink-0"/>
                 
                 <div className="flex items-center w-full min-w-0 overflow-hidden">
                    <span className="text-zinc-400 text-sm whitespace-nowrap truncate max-w-[120px]">
                        {baseUrl.replace(/^https?:\/\//, '')}/
                    </span>
                    
                    {/* INPUT DO SLUG */}
                    <input 
                        value={formData.slug} 
                        onChange={e => setFormData({...formData, slug: generateSlug(e.target.value)})} 
                        className="bg-transparent text-sm text-zinc-900 w-full outline-none font-bold placeholder:text-zinc-300 ml-0.5"
                        placeholder="nome-da-loja"
                    />
                 </div>

                 <button onClick={copyToClipboard} className="text-zinc-400 hover:text-zinc-900 transition-colors p-1" title="Copiar link">
                    {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                 </button>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Se alterar o nome da loja, este link mudará automaticamente (mas você pode editar se quiser).
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA - FORMULÁRIO */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Store size={18} className="text-indigo-600"/> Dados Básicos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600">Nome Fantasia</label>
                  
                  {/* AQUI ESTÁ A MÁGICA: Ao digitar o nome, atualiza o slug junto */}
                  <input 
                    value={formData.name} 
                    onChange={e => {
                        const newName = e.target.value;
                        const newSlug = generateSlug(newName);
                        setFormData({...formData, name: newName, slug: newSlug});
                    }} 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" 
                    placeholder="Ex: Force Suplementos"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600">WhatsApp / Telefone</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"/>
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600">Endereço</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"/>
                </div>
              </div>
            </section>

            {/* SEÇÕES DE CORES E HORÁRIOS CONTINUAM IGUAIS... */}
            <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Palette size={18} className="text-purple-600"/> Personalização
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-200 p-3 rounded-lg flex items-center justify-between hover:bg-zinc-50 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-xs text-zinc-500">Cor Principal</span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase">{formData.primaryColor}</span>
                   </div>
                   <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"/>
                </div>
                <div className="border border-zinc-200 p-3 rounded-lg flex items-center justify-between hover:bg-zinc-50 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-xs text-zinc-500">Cor Destaque</span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase">{formData.secondaryColor}</span>
                   </div>
                   <input type="color" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"/>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600"/> Horários
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600">Abertura</label>
                  <input type="time" value={formData.opensAt} onChange={e => setFormData({...formData, opensAt: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-600 outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600">Fechamento</label>
                  <input type="time" value={formData.closesAt} onChange={e => setFormData({...formData, closesAt: e.target.value})} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-600 outline-none"/>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* BARRA FIXA DE SALVAR */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-zinc-200 flex justify-end z-40 lg:pl-64">
           <div className="w-full max-w-6xl mx-auto flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="bg-zinc-900 hover:bg-black text-white font-medium text-sm py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg shadow-zinc-200 active:scale-95 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
              Salvar Alterações
            </button>
           </div>
        </div>

    </div>
  );
}