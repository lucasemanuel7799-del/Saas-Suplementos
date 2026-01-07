"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser"; // <--- Mantendo a importação correta
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pega a URL de onde o usuário veio ou vai para Home
  const redirectUrl = searchParams.get("redirect") || "/";

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Apenas campos de Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sucesso: Redireciona para onde o usuário queria ir
      router.refresh();
      window.location.href = redirectUrl;

    } catch (error: any) {
      console.error(error);
      setErrorMsg("Email ou senha incorretos.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-sm">
        
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Entre para aceder à sua conta
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-black/50 p-3 text-white focus:border-blue-600 focus:outline-none placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>Entrar <LogIn className="ml-2 h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Rodapé com Link para Cadastro */}
        <div className="text-center space-y-4 pt-4 border-t border-zinc-800 mt-6">
          <p className="text-sm text-zinc-400">
            Não tem uma conta?{" "}
            <Link 
              href="/register" 
              className="font-medium text-blue-500 hover:text-blue-400 transition-colors hover:underline"
            >
              Cadastre-se agora
            </Link>
          </p>

          <div className="block pt-2">
             <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
               Voltar para a loja
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}