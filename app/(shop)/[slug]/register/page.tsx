"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, User, Mail, Lock, Phone, ArrowRight, Calendar } from "lucide-react";

export default function CustomerRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const storeId = searchParams.get("store_id");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birthDate: "", // Novo estado para a data
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta.");

      // 2. Salvar na Tabela Global (COM A NOVA DATA)
      const { error: customerError } = await supabase.from("customers").upsert({
        id: authData.user.id,
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        birth_date: formData.birthDate, // Salvando a data aqui
      });

      if (customerError) throw customerError;

      // 3. Vincular à Loja
      if (storeId) {
        await supabase.from("store_customers").upsert({
          store_id: storeId,
          customer_id: authData.user.id
        });
      }

      router.push("/perfil");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-zinc-900">Criar sua conta</h1>
          <p className="text-zinc-500 mt-2">Cadastre-se para acompanhar seus pedidos.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-8">

          {/* 1. Nome Completo (Largura Total) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                placeholder="Ex: João Silva"
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* 2. E-mail (Largura Total) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email" required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                placeholder="seu@email.com"
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* 3. GRID: Data e Telefone (Lado a Lado) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Data de Nascimento */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                {/* Adicionei 'appearance-none' e 'block' para forçar a largura correta */}
                <input
                  type="date"
                  required
                  className="w-full block bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-500 transition-all text-zinc-600 appearance-none"
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
            </div>

            {/* Telefone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                  placeholder="(00) 00000-0000"
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 4. Senha (Largura Total) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password" required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-500 transition-all"
                placeholder="••••••••"
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Criar conta <ArrowRight size={18} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Já tem uma conta? <a href="/login" className="text-red-600 font-bold">Fazer login</a>
        </p>
      </div>
    </div>
  );
}