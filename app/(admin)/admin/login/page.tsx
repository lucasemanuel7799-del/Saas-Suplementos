"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function handleAdminLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.refresh();
            router.push("/admin");

        } catch (err: any) {
            console.error(err);
            setErrorMsg("Acesso negado. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white font-sans overflow-hidden">

            {/* BACKGROUND EFFECTS (Igual da Landing) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                {/* Glow Centralizado */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600 opacity-10 blur-[100px] rounded-full" />
            </div>

            {/* BOTÃO VOLTAR */}
            <div className="absolute top-8 left-8 z-10">
                <Link
                    href="/"
                    className="group flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-orange-500"
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    Voltar para o site
                </Link>
            </div>

            <div className="relative w-full max-w-sm p-4 animate-in fade-in zoom-in duration-500 z-10">

                {/* Logo / Branding */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Painel Lojista
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        Gerencie sua loja SuppleS.
                    </p>
                </div>

                {/* Formulário */}
                <form
                    onSubmit={handleAdminLogin}
                    className="space-y-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md"
                >

                    {errorMsg && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 animate-in slide-in-from-top-2">
                            <AlertCircle size={14} />
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                            placeholder="admin@suple-saas.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
                            placeholder="••••••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                Acessando...
                            </div>
                        ) : (
                            "Entrar no Sistema"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
                        <Lock size={10} />
                        Ambiente Seguro SuppleS
                    </p>
                </div>
            </div>
        </div>
    );
}