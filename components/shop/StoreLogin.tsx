"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";

// Agora ele recebe os dados da loja via Props (não precisa buscar de novo)
export default function StoreLogin({ store }: { store: any }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [loggingIn, setLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);

    try {
      if (isSignUp) {
        // CADASTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { phone, name: email.split('@')[0] }
          }
        });
        if (error) throw error;
        toast.success("Conta criada! Entrando...");
        // Pequeno delay para o banco processar
        setTimeout(() => {
            router.refresh(); 
        }, 1000);

      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        toast.success("Login realizado!");
        router.refresh(); // Recarrega a página para o Servidor mostrar a Vitrine
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar.");
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
      
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
        
        {/* Cabeçalho */}
        <div style={{ backgroundColor: store.primary_color || '#000' }} className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 overflow-hidden">
                {store.logo_url ? (
                    <img src={store.logo_url} className="w-full h-full object-cover"/>
                ) : (
                    <StoreIcon className="text-zinc-800" size={32}/>
                )}
            </div>
            <h1 className="text-white font-bold text-xl">{store.name}</h1>
            <p className="text-white/80 text-xs mt-1">
                {isSignUp ? "Crie sua conta para comprar" : "Faça login para fazer seu pedido"}
            </p>
        </div>

        {/* Formulário */}
        <div className="p-8 space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                    <input 
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:border-zinc-400 transition-colors text-sm"
                        placeholder="seu@email.com"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase">Senha</label>
                    <input 
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:border-zinc-400 transition-colors text-sm"
                        placeholder="******"
                    />
                </div>

                {isSignUp && (
                   <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase">WhatsApp</label>
                      <input 
                          type="text" value={phone} onChange={e => setPhone(e.target.value)}
                          className="w-full p-3 rounded-lg bg-zinc-50 border border-zinc-200 outline-none focus:border-zinc-400 transition-colors text-sm"
                          placeholder="(00) 00000-0000"
                      />
                   </div>
                )}

                <button 
                    disabled={loggingIn}
                    style={{ backgroundColor: store.secondary_color || '#000' }}
                    className="w-full py-3.5 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    {loggingIn ? <Loader2 className="animate-spin" size={18}/> : null}
                    {isSignUp ? "Criar Conta" : "Entrar na Loja"}
                </button>
            </form>

            <div className="text-center pt-2">
                <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 underline"
                >
                    {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}