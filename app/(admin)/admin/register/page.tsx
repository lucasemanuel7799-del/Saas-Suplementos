"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store, ArrowRight, CheckCircle2, AlertCircle, Building2, User, UserCircle } from "lucide-react";
import Link from "next/link";

// --- Função auxiliar para máscara de CNPJ ---
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

// --- Componente do Formulário ---
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Verifica se veio do Stripe (Pagamento Confirmado)
  const sessionId = searchParams.get("session_id");
  const isPaidFlow = !!sessionId;

  // Estados dos Campos
  const [personType, setPersonType] = useState<"pf" | "pj">("pf");
  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados de Interface
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Validação de CNPJ
    if (personType === "pj" && cnpj.length < 14) {
        setErrorMsg("Por favor, preencha um CNPJ válido.");
        setLoading(false);
        return;
    }

    try {
      // 1. CRIAÇÃO DA CONTA NO AUTH
      // Enviamos os dados para salvar no metadata. 
      // O Trigger SQL (handle_new_user) vai ler isso e criar as linhas em 'users' e 'stores'.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: ownerName,  // Vai para users.full_name
            store_name: storeName, // Vai para stores.name
            person_type: personType,
            document: personType === 'pj' ? cnpj.replace(/\D/g, "") : null,
          },
        },
      });

      if (authError) throw authError;

      // 2. LOGIN AUTOMÁTICO (Garante a sessão)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const userId = authData.user?.id;

      // 3. SE FOR PAGO, ATIVA O PLANO
      if (isPaidFlow && userId) {
        await supabase
          .from("users")
          .update({
            subscription_status: 'active',
            plan_type: 'pro',
            trial_ends_at: null,
            stripe_customer_id: sessionId
          })
          .eq("id", userId);
      }

      // --- CORREÇÃO DE REDIRECIONAMENTO (Race Condition Fix) ---
      // O banco de dados pode demorar alguns milissegundos para rodar o Trigger e criar o usuário na tabela 'users'.
      // Se redirecionarmos antes disso, o AdminLayout vai bloquear o acesso.
      // Então, esperamos até o usuário aparecer na tabela.
      
      let userCreated = false;
      let attempts = 0;

      if (userId) {
        while (!userCreated && attempts < 10) { // Tenta por ~5 segundos
             // Pergunta pro banco: "O usuário já existe na tabela pública?"
             const { data: checkUser } = await supabase
                .from("users")
                .select("id")
                .eq("id", userId)
                .single();
             
             if (checkUser) {
                userCreated = true; // Sucesso! O Trigger terminou.
             } else {
                // Espera 500ms antes de tentar de novo
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
             }
        }
      }

      if (!userCreated) {
          console.warn("Aviso: Demora na criação do banco de dados. Tentando redirecionar mesmo assim...");
      }

      // 4. REDIRECIONAMENTO FINAL
      // Usamos window.location.href para forçar o recarregamento dos cookies
      window.location.href = "/admin";

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md p-4 animate-in fade-in zoom-in duration-500 z-10">
      
      {/* CABEÇALHO */}
      <div className="mb-6 text-center flex flex-col items-center">
        <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-xl ${isPaidFlow ? 'bg-green-600 shadow-green-900/20' : 'bg-orange-600 shadow-orange-900/20'}`}>
           {isPaidFlow ? <CheckCircle2 size={28} /> : <Store size={28} />}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          {isPaidFlow ? "Pagamento Confirmado" : "Teste Grátis 30 Dias"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {isPaidFlow ? "Sua assinatura está ativa." : "Crie sua loja em menos de 1 minuto."}
        </p>
      </div>

      {/* FORMULÁRIO */}
      <form onSubmit={handleRegister} className="space-y-3 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-2xl backdrop-blur-md">
        
        {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 animate-in slide-in-from-top-2">
                <AlertCircle size={14} />
                {errorMsg}
            </div>
        )}

        {/* --- SEÇÃO 1: RESPONSÁVEL --- */}
        <div className="space-y-3 pt-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">
                Dados do Responsável
            </p>

            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome Completo</label>
                <div className="relative">
                    <UserCircle className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors placeholder:text-zinc-600"
                        placeholder="Ex: Lucas Emanuel"
                    />
                </div>
            </div>

            {/* PF / PJ Toggle */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setPersonType("pf")}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                        personType === "pf" ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    <User size={14} /> <span className="text-xs font-bold">Pessoa Física</span>
                </button>
                <button
                    type="button"
                    onClick={() => setPersonType("pj")}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                        personType === "pj" ? "bg-orange-500/10 border-orange-500 text-orange-500" : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    <Building2 size={14} /> <span className="text-xs font-bold">Pessoa Jurídica</span>
                </button>
            </div>

             {/* Campo Condicional de CNPJ */}
             {personType === "pj" && (
                <div className="space-y-1 animate-in slide-in-from-top-1">
                    <label className="text-xs font-medium text-zinc-400">CNPJ</label>
                    <input
                        type="text"
                        required
                        value={cnpj}
                        maxLength={18}
                        onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                        placeholder="00.000.000/0001-00"
                    />
                </div>
            )}
        </div>

        {/* --- SEÇÃO 2: LOJA E ACESSO --- */}
        <div className="space-y-3 pt-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">
                Dados da Loja & Acesso
            </p>

            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome da Loja</label>
                <div className="relative">
                    <Store className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors placeholder:text-zinc-600"
                        placeholder="Ex: Suplementos Top"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                        placeholder="loja@email.com"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">Senha</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors placeholder:text-zinc-600"
                        placeholder="••••••"
                    />
                </div>
            </div>
        </div>

        {/* Botão de Cadastro */}
        <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2 ${
                isPaidFlow ? "bg-green-600 shadow-green-600/20" : "bg-gradient-to-r from-orange-600 to-orange-500 shadow-orange-600/20"
            }`}
        >
            {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Preparando Loja...
                </div>
            ) : (
                <span className="flex items-center justify-center gap-2">
                   {isPaidFlow ? "Ativar Conta" : "Criar Loja Grátis"} <ArrowRight size={16}/>
                </span>
            )}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <Link href="/admin/login" className="text-xs text-zinc-500 hover:text-white transition-colors">
            Já tem conta? <span className="underline">Fazer Login</span>
        </Link>
      </div>
    </div>
  );
}

// Wrapper Principal (Obrigatório para Suspense / useSearchParams)
export default function RegisterPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white font-sans overflow-hidden py-10">
            {/* Efeitos de Fundo */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600 opacity-10 blur-[100px] rounded-full" />
            </div>
            
            <Suspense fallback={<div className="text-white font-bold animate-pulse">Carregando sistema...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}