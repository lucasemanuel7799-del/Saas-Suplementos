"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Loader2, 
  Store, 
  User, 
  AlertCircle, 
  Building2, 
  UserCircle, 
  CheckCircle2 
} from "lucide-react";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'PF' | 'PJ'>('PF');

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cnpj: "",
    storeName: "",
    storeSlug: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "storeName") {
      // Gera o slug automaticamente a partir do nome da loja
      const slug = value.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      setFormData(prev => ({ ...prev, storeName: value, storeSlug: slug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = () => {
    if (formData.name && formData.email && formData.password.length >= 6) {
      if (accountType === 'PJ' && formData.cnpj.length < 14) {
        setErrorMsg("Por favor, insira um CNPJ válido.");
        return;
      }
      setStep(2);
      setErrorMsg("");
    } else {
      setErrorMsg("Preencha os dados obrigatórios corretamente.");
    }
  };

  const handleFinalSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. BACKEND: Cria Auth e Tabela 'users' (Assinatura/Stripe)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          sessionId 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao registrar usuário.");

      // 2. LOGIN: Autentica para realizar operações no banco via browser
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (loginError) throw loginError;

      // 3. RECUPERAR ID: Pega o ID do usuário recém-criado
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) throw new Error("Não foi possível recuperar o ID do usuário.");

      // 4. TABELA STORES: Salva dados da loja usando o ID do usuário como ID da loja (1:1)
      const { error: storeError } = await supabase.from("stores").upsert({
        id: userId,                   // O ID da loja é identico ao do usuário
        owner_id: userId,             // Mantemos a referência do dono
        name: formData.storeName,
        slug: formData.storeSlug,
        cnpj: accountType === 'PJ' ? formData.cnpj : null, // Salva o CNPJ apenas se for PJ
      }, { onConflict: 'id' });

      if (storeError) {
        if (storeError.code === '23505') throw new Error("Este link de loja já está em uso.");
        throw storeError;
      }

      // 5. SUCESSO: Redireciona para o Dashboard
      router.refresh();
      router.push("/admin");

    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado.");
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white p-6">
        <div className="text-center p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 backdrop-blur-md max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-bold mb-2">Checkout Necessário</h1>
          <p className="text-zinc-400 mb-6">Você precisa concluir o pagamento para acessar esta página.</p>
          <Link href="/landing#planos" className="block w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-700">Ver Planos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4" 
         onKeyDown={(e) => {
           if (e.key === 'Enter') {
             e.preventDefault();
             step === 1 ? handleNextStep() : handleFinalSubmit();
           }
         }}>
      <div className="w-full max-w-lg bg-zinc-900/40 p-8 border border-zinc-800 rounded-2xl backdrop-blur-md shadow-2xl">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 mb-4">
            <CheckCircle2 size={14} /> Pagamento Confirmado
          </div>
          <h1 className="text-2xl font-bold text-white">Configure seu Painel</h1>
        </div>

        <div className="mb-6 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-blue-600' : 'bg-zinc-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-zinc-800'}`} />
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16}/> {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <h2 className="text-blue-400 font-bold text-xs uppercase flex items-center gap-2"><User size={14}/> Responsável</h2>
              <input name="name" placeholder="Seu Nome" value={formData.name} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-blue-600" />
              
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAccountType('PF')} className={`p-3 rounded-lg border text-sm transition-all ${accountType === 'PF' ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-zinc-800 text-zinc-500'}`}>Pessoa Física</button>
                <button type="button" onClick={() => setAccountType('PJ')} className={`p-3 rounded-lg border text-sm transition-all ${accountType === 'PJ' ? 'border-blue-600 bg-blue-600/10 text-blue-500' : 'border-zinc-800 text-zinc-500'}`}>Pessoa Jurídica</button>
              </div>

              {accountType === 'PJ' && (
                <input name="cnpj" placeholder="CNPJ da Empresa" value={formData.cnpj} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-blue-600" />
              )}

              <input name="email" type="email" placeholder="Seu melhor e-mail" value={formData.email} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-blue-600" />
              <input name="password" type="password" placeholder="Senha (mín. 6 dígitos)" value={formData.password} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-blue-600" />
              <button type="button" onClick={handleNextStep} className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all text-white">Ir para dados da loja</button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h2 className="text-blue-400 font-bold text-xs uppercase flex items-center gap-2"><Store size={14}/> Identidade da Loja</h2>
              <input name="storeName" placeholder="Nome da sua Loja" value={formData.storeName} onChange={handleChange} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-blue-600" />
              
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold ml-1">Endereço do seu site</label>
                <div className="relative flex items-center mt-1">
                  <span className="absolute left-3 text-zinc-500 text-sm">suplesaas.com/</span>
                  <input name="storeSlug" value={formData.storeSlug} onChange={(e) => setFormData({...formData, storeSlug: e.target.value})} className="w-full bg-black/40 border border-zinc-800 p-3 pl-32 rounded-lg text-white outline-none focus:border-blue-600 font-mono text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="p-3 border border-zinc-800 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-all">Voltar</button>
                <button type="button" onClick={handleFinalSubmit} disabled={loading} className="bg-blue-600 p-3 rounded-lg font-bold text-white flex justify-center items-center hover:bg-blue-700 transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar minha loja"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}