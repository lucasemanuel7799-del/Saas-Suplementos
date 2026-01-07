"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { FreeTrialModal } from "@/components/landing/free-trial-modal"; // Importe o modal

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado do Modal

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white">
              S
            </div>
            <span className="text-lg font-bold text-white">SupleSaaS</span>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#funcionalidades" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Funcionalidades
            </Link>
            <Link href="#precos" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Preços
            </Link>
            <Link href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">
              FAQ
            </Link>
          </nav>

          {/* Botões de Ação */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-zinc-300 hover:text-white">
              Entrar
            </Link>
            
            {/* BOTÃO TESTE GRÁTIS */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
              Teste Grátis
            </button>
          </div>

          {/* Menu Mobile Button (Opcional, mantive simples) */}
          <button className="md:hidden text-zinc-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Renderiza o Modal aqui */}
      <FreeTrialModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}