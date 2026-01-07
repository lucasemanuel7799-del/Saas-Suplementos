"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Destino fixo: Home
  const redirectUrl = "/"; 

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState(""); 

  // Função auxiliar para forçar o cookie
  const setAuthCookie = (accessToken: string) => {
    // Cria um cookie chamado 'sb-auth-token' que expira em 1 semana
    // Isso garante que o Middleware veja que você está logado
    document.cookie = `sb-auth-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  };

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // CORREÇÃO CRÍTICA: Força o salvamento do Cookie
        if (data.session?.access_token) {
          setAuthCookie(data.session.access_token);
        }
        
        // Vai para a Home
        window.location.href = redirectUrl; 

      } else {
        // --- CADASTRO ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              birth_date: birthDate,
            },
          },
        });
        if (error) throw error;

        // Tenta logar automaticamente
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (!loginError && loginData.session) {
          // CORREÇÃO CRÍTICA: Força o salvamento do Cookie aqui também
          setAuthCookie(loginData.session.access_token);
          window.location.href = redirectUrl;
        } else {
          alert("Conta criada! Faça login para continuar.");
          setIsLogin(true);
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro ao entrar. Verifique seus dados.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-sm">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isLogin 
              ? "Entre para acessar a loja e fazer pedidos" 
              : "Preencha seus dados para começar a comprar"}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleAuth}>
          
          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-medium text-zinc-400">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none"
                  placeholder="Ex: Lucas Emanuel"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400">Telefone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400">Nascimento</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isLogin ? (
              <>Entrar na Loja <LogIn className="ml-2 h-4 w-4" /></>
            ) : (
              <>Criar Conta <UserPlus className="ml-2 h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-sm font-medium text-blue-500 hover:text-blue-400"
          >
            {isLogin 
              ? "Não tem uma conta? Cadastre-se agora" 
              : "Já tem uma conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}