"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Campos de Cadastro
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState(""); 

  // Função auxiliar para forçar o cookie (Igual ao Login)
  const setAuthCookie = (accessToken: string) => {
    document.cookie = `sb-auth-token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Criar usuário no Supabase
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

      // 2. Tenta fazer login automático imediatamente após criar
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      // Se conseguir logar (significa que não precisa confirmar email ou já confirmou)
      if (!loginError && loginData.session) {
        setAuthCookie(loginData.session.access_token);
        window.location.href = "/"; // Redireciona para Home com refresh
      } else {
        // Se precisar de confirmação de email
        alert("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
        router.push("/login");
      }

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Erro ao criar conta. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-zinc-100">
      
      {/* Botão Voltar para Loja (Opcional, mas boa prática) */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Voltar para a loja
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-sm">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Preencha seus dados para começar a comprar
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          
          <div>
            <label className="text-xs font-medium text-zinc-400">Nome Completo</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none placeholder:text-zinc-600"
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
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none placeholder:text-zinc-600"
                placeholder="(00) 99999-9999"
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

          <div>
            <label className="text-xs font-medium text-zinc-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none placeholder:text-zinc-600"
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
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none placeholder:text-zinc-600"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>Criar Conta Grátis <UserPlus className="ml-2 h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800/50 mt-4">
          <p className="text-sm text-zinc-400">
            Já tem uma conta?{" "}
            <Link 
              href="/login"
              className="font-medium text-blue-500 hover:text-blue-400 transition-colors hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}