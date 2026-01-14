"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  Store, Save, Camera, Loader2, Copy, Check, Globe, 
  Palette, Clock, CreditCard, Banknote, QrCode, Link as LinkIcon,
  Info, Smartphone, MapPin, Phone, Settings2, Truck, DollarSign,
  Zap, Navigation, CheckCircle2, Lock, HelpCircle
} from "lucide-react";
import { toast } from "sonner";

// --- DADOS ESTÁTICOS ---
const AVAILABLE_PAYMENTS = [
  { 
    id: "pix", 
    label: "Pix", 
    info: "O cliente faz o Pix manualmente e envia o comprovante no WhatsApp. Você deve fornecer sua chave no chat.",
    icon: <QrCode size={18} /> 
  },
  { 
    id: "card_machine", 
    label: "Maquininha", 
    info: "O entregador leva a máquina de cartão até o cliente. Recomendado apenas se você tiver frota própria.",
    icon: <Smartphone size={18} /> 
  },
  { 
    id: "card_link", 
    label: "Link de Pagamento", 
    info: "Você gera um link (Mercado Pago, InfinitePay) e envia no chat para o cliente pagar.",
    icon: <LinkIcon size={18} /> 
  },
  { 
    id: "cash", 
    label: "Dinheiro", 
    info: "Pagamento em espécie na entrega. O sistema perguntará ao cliente se precisa de troco.",
    icon: <Banknote size={18} /> 
  },
];

const WEEK_DAYS = [
  { id: 0, label: "D" }, { id: 1, label: "S" }, { id: 2, label: "T" }, 
  { id: 3, label: "Q" }, { id: 4, label: "Q" }, { id: 5, label: "S" }, { id: 6, label: "S" },
];

export default function SettingsPage() {
  const supabase = createClient();
  
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  
  const [baseUrl, setBaseUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "", slug: "", phone: "",
    // Endereço
    cep: "", street: "", number: "", neighborhood: "", city: "", uf: "", lat: "", lng: "",
    // Visual
    primaryColor: "#18181b", secondaryColor: "#dc2626",
    // Funcionamento
    opensAt: "08:00", closesAt: "22:00",
    openDays: [1, 2, 3, 4, 5] as number[],
    // Pagamentos e Logística
    paymentMethods: [] as string[],
    deliveryType: "fixed", // 'fixed' | 'km' | 'free'
    deliveryFixedFee: "0",
    deliveryKmRate: "0",
    deliveryFreeMinValue: "0"
  });

  // Helper para URL amigável
  const generateSlug = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
    
    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).maybeSingle();
      
      if (data) {
        setStoreId(data.id);
        setLogoUrl(data.logo_url);
        setFormData({
          ...formData,
          name: data.name || "", 
          slug: data.slug || generateSlug(data.name || ""),
          phone: data.phone || "", 
          cep: data.cep || "",
          street: data.street || "",
          number: data.number || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          uf: data.uf || "",
          lat: data.lat || "",
          lng: data.lng || "",
          primaryColor: data.primary_color || "#18181b", 
          secondaryColor: data.secondary_color || "#dc2626",
          opensAt: data.opens_at || "08:00", 
          closesAt: data.closes_at || "22:00",
          openDays: Array.isArray(data.open_days) ? data.open_days : [1,2,3,4,5],
          paymentMethods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
          deliveryType: data.delivery_type || "fixed",
          deliveryFixedFee: String(data.delivery_fixed_fee || 0),
          deliveryKmRate: String(data.delivery_km_rate || 0),
          deliveryFreeMinValue: String(data.delivery_free_min_value || 0),
        });
      }
      setLoading(false);
    }
    loadStore();
  }, [supabase]);

  // --- BUSCA DE CEP INTELIGENTE (ViaCEP + Nominatim) ---
  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setFetchingCep(true);
    try {
      // 1. Busca Endereço (ViaCEP)
      const resViaCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dataViaCep = await resViaCep.json();

      if (dataViaCep.erro) {
        toast.error("CEP não encontrado.");
        setFetchingCep(false);
        return;
      }

      // 2. Busca Coordenadas (OpenStreetMap/Nominatim)
      // Constrói query: "Rua, Cidade, Estado, Brazil"
      const query = `${dataViaCep.logradouro}, ${dataViaCep.localidade}, ${dataViaCep.uf}, Brazil`;
      const resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const dataGeo = await resGeo.json();
      
      let lat = "";
      let lng = "";

      if (dataGeo && dataGeo.length > 0) {
        lat = dataGeo[0].lat;
        lng = dataGeo[0].lon;
      }

      // 3. Atualiza Estado
      setFormData(prev => ({ 
        ...prev, 
        street: dataViaCep.logradouro, 
        neighborhood: dataViaCep.bairro, 
        city: dataViaCep.localidade, 
        uf: dataViaCep.uf,
        lat: lat,
        lng: lng
      }));

    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar dados do endereço.");
    } finally {
      setFetchingCep(false);
    }
  };

  // --- FUNÇÕES AUXILIARES ---
  const toggleDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      openDays: prev.openDays.includes(dayId) ? prev.openDays.filter(d => d !== dayId) : [...prev.openDays, dayId]
    }));
  };

  const togglePayment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(id) ? prev.paymentMethods.filter(i => i !== id) : [...prev.paymentMethods, id]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !storeId) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileName = `${storeId}/logo-${Date.now()}`;
      await supabase.storage.from('store-logos').upload(fileName, file, { upsert: true });
      const { data } = supabase.storage.from('store-logos').getPublicUrl(fileName);
      setLogoUrl(data.publicUrl);
      await supabase.from("stores").update({ logo_url: data.publicUrl }).eq("id", storeId);
      toast.success("Logo atualizada!");
    } catch { toast.error("Erro no upload."); } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("stores").update({
          name: formData.name, slug: formData.slug, phone: formData.phone, 
          cep: formData.cep, street: formData.street, number: formData.number,
          neighborhood: formData.neighborhood, city: formData.city, uf: formData.uf,
          lat: formData.lat, lng: formData.lng, // Salva coordenadas
          logo_url: logoUrl,
          primary_color: formData.primaryColor, secondary_color: formData.secondaryColor,
          opens_at: formData.opensAt, closes_at: formData.closesAt, 
          open_days: formData.openDays,
          payment_methods: formData.paymentMethods,
          delivery_type: formData.deliveryType,
          delivery_fixed_fee: parseFloat(formData.deliveryFixedFee.replace(',', '.')),
          delivery_km_rate: parseFloat(formData.deliveryKmRate.replace(',', '.')),
          delivery_free_min_value: parseFloat(formData.deliveryFreeMinValue.replace(',', '.')),
        }).eq("id", storeId);
      if (error) throw error;
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar."); } 
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950"><Loader2 className="animate-spin text-orange-600" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 border border-orange-500/20"><Settings2 size={24} /></div>
          <div><h1 className="text-xl font-bold text-white">Configurações Gerais</h1><p className="text-zinc-500 text-xs">Administre sua loja de forma centralizada.</p></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-900/20">
          {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: DADOS BÁSICOS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
           <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Store size={14} className="text-emerald-500"/> Informações Básicas</h3>
           <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">WhatsApp de Pedidos</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="(00) 00000-0000" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">Nome Fantasia</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none" /></div>
           </div>
        </div>

        {/* CARD 2: LOGO E LINK */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="flex flex-col items-center">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center overflow-hidden ring-2 ring-orange-500/10">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="Logo"/> : <Store className="text-zinc-800" size={32}/>}
                </div>
                <label className="absolute bottom-0 right-0 h-8 w-8 bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer border-4 border-zinc-900 shadow-xl"><Camera size={14} /><input type="file" className="hidden" onChange={(e) => {/* handleImageUpload */}} /></label>
             </div>
          </div>
          <div className="space-y-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-[10px] text-white font-mono truncate">{baseUrl.replace(/^https?:\/\//, '')}/{formData.slug}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/${formData.slug}`); toast.success("Copiado!"); }} className="text-zinc-500 hover:text-white"><Copy size={16}/></button>
            </div>
            <input value={formData.slug} onChange={e => setFormData({...formData, slug: generateSlug(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none" placeholder="link-da-loja" />
          </div>
        </div>

        {/* CARD 3: ENDEREÇO (GEO INTELIGENTE) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-red-500"/> Localização</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-zinc-600 uppercase ml-1">CEP</label>
              <div className="relative"><input value={formData.cep} onBlur={handleCepBlur} onChange={e => setFormData({...formData, cep: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2.5 text-xs text-white focus:border-red-500 outline-none" placeholder="00000-000" />{fetchingCep && <Loader2 className="absolute right-3 top-2.5 animate-spin text-orange-500" size={14}/>}</div>
            </div>
            <div className="col-span-2"><input value={formData.street} readOnly className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-2 text-[10px] text-zinc-500 outline-none" placeholder="Rua..." /></div>
            <div><input value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-xs text-white focus:border-red-500 outline-none" placeholder="Nº" /></div>
            <div><input value={formData.neighborhood} readOnly className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-2 text-[10px] text-zinc-500 outline-none" placeholder="Bairro" /></div>
          </div>
        </div>

        {/* CARD 4: LOGÍSTICA (FRETE) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Truck size={14} className="text-orange-500"/> Regras de Frete</h3>
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
               <button type="button" onClick={() => setFormData(prev => ({...prev, deliveryType: 'fixed'}))} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${formData.deliveryType === 'fixed' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Taxa Fixa</button>
               <button type="button" onClick={() => setFormData(prev => ({...prev, deliveryType: 'km'}))} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${formData.deliveryType === 'km' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Por KM</button>
               <button type="button" onClick={() => setFormData(prev => ({...prev, deliveryType: 'free'}))} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${formData.deliveryType === 'free' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Grátis</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            
            {/* INPUT DINÂMICO (FIXO OU KM) */}
            <div className="flex flex-col h-full bg-zinc-950 rounded-lg border border-zinc-800 p-5 justify-center">
              {formData.deliveryType === 'free' ? (
                <div className="flex flex-col items-center justify-center text-center">
                   <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                   <p className="text-[10px] font-bold text-emerald-400 uppercase">Entrega Grátis</p>
                   <p className="text-[9px] text-zinc-500">Nenhuma taxa será cobrada.</p>
                </div>
              ) : (
                <>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                    {formData.deliveryType === 'km' ? <Navigation size={12}/> : <DollarSign size={12}/>}
                    {formData.deliveryType === 'km' ? 'Valor por KM' : 'Taxa Fixa'}
                  </label>
                  <input 
                    value={formData.deliveryType === 'km' ? formData.deliveryKmRate : formData.deliveryFixedFee} 
                    onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                            ...prev, 
                            [prev.deliveryType === 'km' ? 'deliveryKmRate' : 'deliveryFixedFee']: val
                        }));
                    }} 
                    className="bg-transparent border-none text-2xl text-white font-black outline-none w-full" 
                    placeholder="0,00" 
                  />
                  {formData.deliveryType === 'km' && <p className="text-[9px] text-zinc-600 mt-1">* O sistema calculará a distância exata.</p>}
                </>
              )}
            </div>

            {/* INPUT BÔNUS */}
            <div className={`p-5 rounded-lg border flex flex-col justify-center transition-all ${formData.deliveryType === 'free' ? 'bg-zinc-900 border-zinc-800 opacity-30 pointer-events-none' : 'bg-zinc-950 border-emerald-500/20'}`}>
              <div className="flex items-center gap-2 mb-2"><Zap size={14} className="text-emerald-500"/><span className="text-[10px] font-bold text-emerald-500 uppercase">Grátis acima de</span></div>
              <input value={formData.deliveryFreeMinValue} onChange={e => setFormData({...formData, deliveryFreeMinValue: e.target.value})} className="bg-transparent border-none text-2xl text-white font-black outline-none" placeholder="0,00" />
            </div>
          </div>
        </div>

        {/* CARD 5: PAGAMENTO PLATAFORMA (EM BREVE) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-sm">
           <div className="absolute top-0 right-0 p-3"><Lock size={16} className="text-zinc-700"/></div>
           <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-blue-500"/> Pagamento Online</h3>
              <p className="text-[10px] text-zinc-600 leading-tight">Receba via Cartão e Pix direto pelo site com taxas reduzidas.</p>
           </div>
           <button type="button" disabled className="w-full py-3 rounded-lg bg-zinc-800 text-zinc-600 font-bold text-[10px] uppercase tracking-widest border border-zinc-700 cursor-not-allowed">Em Breve</button>
        </div>

        {/* CARD 6: HORÁRIOS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Clock size={14} className="text-orange-500"/> Horários</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Abre</span>
                  <input type="time" value={formData.opensAt} onChange={e => setFormData({...formData, opensAt: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none w-full" />
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase block mb-1">Fecha</span>
                  <input type="time" value={formData.closesAt} onChange={e => setFormData({...formData, closesAt: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none w-full" />
                </div>
             </div>
             <div className="flex justify-between gap-1">
                {WEEK_DAYS.map(day => (
                  <button type="button" key={day.id} onClick={() => toggleDay(day.id)} className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all border ${formData.openDays.includes(day.id) ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}>{day.label}</button>
                ))}
             </div>
          </div>
        </div>

        {/* CARD 7: VISUAL */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Palette size={14} className="text-purple-500"/> Visual</h3>
          <div className="space-y-3">
             <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Tema</span>
                <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-8 h-8 rounded-md bg-transparent border-0 cursor-pointer" />
             </div>
             <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Botões</span>
                <input type="color" value={formData.secondaryColor} onChange={e => setFormData({...formData, secondaryColor: e.target.value})} className="w-8 h-8 rounded-md bg-transparent border-0 cursor-pointer" />
             </div>
          </div>
        </div>

        {/* CARD 8: PAGAMENTOS MANUAIS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-blue-500"/> Formas de Pagamento no Recebimento</h3>
            <span className="text-[9px] font-black text-blue-400 bg-blue-400/5 px-2 py-1 rounded-md border border-blue-400/10 uppercase">WhatsApp Checkout</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AVAILABLE_PAYMENTS.map((payment) => {
              const isSelected = formData.paymentMethods.includes(payment.id);
              return (
                <div key={payment.id} className="relative group/card">
                  <button 
                    type="button"
                    onClick={() => togglePayment(payment.id)} 
                    className={`w-full flex flex-col items-center justify-center p-6 rounded-lg border transition-all gap-2 relative ${isSelected ? 'bg-orange-600 text-white border-orange-400 shadow-xl' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                  >
                    {payment.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{payment.label}</span>
                    <div className="absolute top-2 right-2 text-zinc-700 group-hover/card:text-zinc-400 transition-colors"><HelpCircle size={14} /></div>
                  </button>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl opacity-0 invisible group-hover/card:opacity-100 group-hover/card:visible transition-all z-50 pointer-events-none">
                    <p className="text-[10px] text-zinc-300 leading-relaxed text-center font-medium">{payment.info}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-800"></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex items-start gap-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
             <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[10px] text-zinc-500 italic leading-snug">
               Dica: Selecione apenas os métodos que você realmente consegue processar manualmente.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}