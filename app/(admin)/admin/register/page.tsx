"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store, ArrowRight, CheckCircle2, AlertCircle, Building2, User, UserCircle } from "lucide-react";
import Link from "next/link";

// --- Funções Auxiliares ---
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const sessionId = searchParams.get("session_id");
  const isPaidFlow = !!sessionId;

  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. CRIA O USUÁRIO NO AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: ownerName,
            store_name: storeName,
          },
        },
      });

      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar credenciais de acesso.");

      // 2. LOGIN IMEDIATO (Necessário para ter permissão de escrita)
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;

      // Aguarda um breve momento para sincronização do banco
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. GARANTIA DO PERFIL (public.users)
      // Se o gatilho falhar, criamos o perfil manualmente
      const { data: userProfile } = await supabase.from("users").select("id").eq("id", userId).maybeSingle();
      
      if (!userProfile) {
        await supabase.from("users").insert({
          id: userId,
          email: email,
          full_name: ownerName,
          subscription_status: isPaidFlow ? 'active' : 'trial'
        });
      }

      // 4. RESOLVER A LOJA (public.stores)
      const cleanSlug = generateSlug(storeName);
      const { data: existingStore } = await supabase.from("stores").select("id").eq("owner_id", userId).maybeSingle();

      if (existingStore) {
        // Se o gatilho criou a loja duplicada, nós a formatamos corretamente
        await supabase.from("stores").update({
          name: storeName,
          slug: cleanSlug,
          active: true
        }).eq("id", existingStore.id);
      } else {
        // Se não existir, criamos a única loja do usuário
        const { error: storeError } = await supabase.from("stores").insert({
          name: storeName,
          slug: cleanSlug,
          owner_id: userId,
          active: true
        });
        if (storeError) {
            if (storeError.message.includes("duplicate")) throw new Error("Este nome de loja já está em uso.");
            throw storeError;
        }
      }

      // 5. ATUALIZAR PLANO SE FOR PAGO
      if (isPaidFlow) {
        await supabase.from("users").update({
          subscription_status: 'active',
          plan_type: 'pro'
        }).eq("id", userId);
      }

      // 6. SUCESSO - REDIRECIONAR
      window.location.href = "/admin";

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao processar registro.");
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md p-4 animate-in fade-in zoom-in duration-500 z-10">
      <div className="mb-6 text-center flex flex-col items-center">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-xl ${isPaidFlow ? 'bg-green-600 shadow-green-900/20' : 'bg-orange-600 shadow-orange-900/20'}`}>
           {isPaidFlow ? <CheckCircle2 size={28} /> : <Store size={28} />}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          {isPaidFlow ? "Pagamento Confirmado" : "Teste Grátis 30 Dias"}
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Configure sua conta para acessar o painel.</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-2xl backdrop-blur-md">
        {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle size={14} />
                {errorMsg}
            </div>
        )}

        <div className="space-y-3 pt-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">Responsável</p>
            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome Completo</label>
                <div className="relative">
                    <UserCircle className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input type="text" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 p-2.5 text-sm text-white focus:border-orange-500 outline-none transition-colors" placeholder="Seu nome" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPersonType("pf")} className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-[10px] font-bold transition-all ${personType === "pf" ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/30 border-zinc-800 text-zinc-500"}`}><User size={14} /> PESSOA FÍSICA</button>
                <button type="button" onClick={() => setPersonType("pj")} className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-[10px] font-bold transition-all ${personType === "pj" ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/30 border-zinc-800 text-zinc-500"}`}><Building2 size={14} /> PESSOA JURÍDICA</button>
            </div>

             {personType === "pj" && (
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">CNPJ</label>
                    <input type="text" required value={cnpj} maxLength={18} onChange={(e) => setCnpj(formatCNPJ(e.target.value))} className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 outline-none" placeholder="00.000.000/0001-00" />
                </div>
            )}
        </div>

        <div className="space-y-3 pt-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">Loja & Acesso</p>
            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome da Loja</label>
                <div className="relative">
                    <Store className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 p-2.5 text-sm text-white focus:border-orange-500 outline-none" placeholder="Nome da sua loja" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 outline-none" placeholder="seu@email.com" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Senha</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 outline-none" placeholder="••••••" />
                </div>
            </div>
        </div>

        <button type="submit" disabled={loading} className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 mt-2 ${isPaidFlow ? "bg-green-600" : "bg-orange-600 shadow-lg shadow-orange-600/20"}`}>
            {loading ? <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Criando...</div> : <span className="flex items-center justify-center gap-2">Finalizar Cadastro <ArrowRight size={16}/></span>}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/admin/login" className="text-xs text-zinc-500 hover:text-white transition-colors">
            Já possui uma loja? <span className="underline">Entrar no painel</span>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 font-sans py-10 overflow-x-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600 opacity-10 blur-[100px] rounded-full" />
            </div>
            <Suspense fallback={<div className="text-white font-bold animate-pulse">Carregando...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}