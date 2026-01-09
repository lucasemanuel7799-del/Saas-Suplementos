"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const storeId = searchParams.get("store_id");

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Após o login, volta para a loja
      router.push("/"); 
      router.refresh();
    } catch (error: any) {
      alert("Erro ao entrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-zinc-900 italic">SUPLESAAS</h1>
          <p className="text-zinc-500 mt-2">Faça login para acessar a loja e ver as ofertas.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="email" required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="password" required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18}/> Entrar na loja</>}
          </button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-500">
            Não tem conta? <a href={`/register?store_id=${storeId}`} className="text-red-600 font-bold">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  );
}