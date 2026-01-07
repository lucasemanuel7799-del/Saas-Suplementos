"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  // Refs para scroll suave (CORRIGIDO)
  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ...restante do código igual

  return (
    <div className="bg-[#09090b] min-h-screen w-full text-zinc-100 font-sans">
      {/* HEADER */}
      <header className="fixed w-full z-50 bg-[#09090b]/80 backdrop-blur border-b border-zinc-800 shadow-sm px-4 sm:px-8 py-2">
        <nav className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <button
            className="font-extrabold text-2xl text-blue-500 hover:opacity-90 tracking-tight"
            onClick={() => scrollTo(heroRef)}
            style={{ letterSpacing: '-0.03em' }}
          >
            Suple<span className="text-white">SaaS</span>
          </button>
          <div className="hidden md:flex space-x-7 text-zinc-300 font-semibold text-sm">
            <button className="hover:text-white transition" onClick={() => scrollTo(featuresRef)}>
              Funcionalidades
            </button>
            <button className="hover:text-white transition" onClick={() => scrollTo(plansRef)}>
              Planos
            </button>
            <button className="hover:text-white transition" onClick={() => scrollTo(faqRef)}>
              FAQ
            </button>
          </div>
          <div className="space-x-3 flex items-center">
            <button className="rounded-md border border-blue-700 px-4 py-1.5 text-blue-400 hover:text-white hover:border-white transition text-sm font-bold"
              onClick={() => router.push("/login")}>Login</button>
            <button className="rounded-md bg-blue-600 px-4 py-1.5 text-white text-sm font-bold hover:bg-blue-700 transition"
              onClick={() => router.push("/register")}>Criar Conta</button>
          </div>
        </nav>
        {/* Navbar Mobile */}
        <div className="flex md:hidden mt-2 px-2 pb-1 gap-2 text-sm">
          <button className="flex-1 rounded bg-zinc-800/50 py-2 hover:bg-blue-700/30"
            onClick={() => scrollTo(featuresRef)}>Funcionalidades</button>
          <button className="flex-1 rounded bg-zinc-800/50 py-2 hover:bg-blue-700/30"
            onClick={() => scrollTo(plansRef)}>Planos</button>
          <button className="flex-1 rounded bg-zinc-800/50 py-2 hover:bg-blue-700/30"
            onClick={() => scrollTo(faqRef)}>FAQ</button>
        </div>
      </header>
      {/* HERO */}
      <section ref={heroRef} className="min-h-screen flex flex-col justify-center items-center text-center gap-6 pt-44 pb-24 px-4 bg-gradient-to-b from-[#09090b] via-[#151624] to-[#151624]/90">
        <h1 className="max-w-3xl mx-auto text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
          A plataforma SaaS <span className="text-blue-400">definitiva</span> para lojas de suplementos
        </h1>
        <p className="max-w-xl mx-auto text-lg text-zinc-300 mt-2">
          Gestione estoques, pedidos, carrinho, loja online, venda pelo WhatsApp e muito mais.<br />
          Tudo integrado e fácil de usar.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 transition-colors font-bold text-white rounded-xl px-8 py-4 text-lg shadow-lg"
            onClick={() => router.push("/register")}>Experimente Grátis</button>
          <button className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-bold hover:bg-zinc-800 transition rounded-xl px-8 py-4 text-lg"
            onClick={() => scrollTo(featuresRef)}>Ver Funcionalidades</button>
        </div>
      </section>
      {/* FUNCIONALIDADES */}
      <section ref={featuresRef} className="max-w-5xl mx-auto py-20 px-4" id="funcionalidades">
        <h2 className="text-3xl font-extrabold mb-10 text-blue-400 text-center">Funcionalidades</h2>
        <div className="grid md:grid-cols-3 gap-10">{/* ...cards... */}</div>
      </section>
      {/* PLANOS */}
      <section ref={plansRef} className="w-full py-20 bg-[#080817] px-4" id="planos">
        <h2 className="text-3xl font-extrabold mb-10 text-blue-400 text-center">Planos</h2>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-8">{/* ...cards... */}</div>
      </section>
      {/* FAQ */}
      <section ref={faqRef} className="max-w-2xl mx-auto py-24 px-4" id="faq">
        <h2 className="text-3xl font-extrabold mb-10 text-blue-400 text-center">Perguntas Frequentes</h2>
        <div className="space-y-7">{/* ...FAQ... */}</div>
      </section>
      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-800 text-center py-6 text-zinc-400 text-sm bg-[#09090b]">
        &copy; {new Date().getFullYear()} SupleSaaS — Todos os direitos reservados.
      </footer>
    </div>
  );
}