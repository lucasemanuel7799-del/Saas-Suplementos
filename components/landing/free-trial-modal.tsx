"use client";

import { X, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FreeTrialModal({ isOpen, onClose }: FreeTrialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* Backdrop com Blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Conteúdo do Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              Comece sem riscos
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">Teste Grátis por 30 Dias</h2>
            <p className="text-zinc-400 text-sm">
              Experimente todas as funcionalidades do sistema. Se não gostar, você não paga nada.
            </p>
          </div>

          {/* Lista de Vantagens do Teste */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <p className="text-sm text-zinc-300">Acesso ilimitado a todas as ferramentas</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <p className="text-sm text-zinc-300">Não cobramos nada hoje</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <p className="text-sm text-zinc-300">Cancele a qualquer momento com 1 clique</p>
            </div>
          </div>

          {/* Botão de Ação */}
          <Link 
            href="/auth/register" // Ou para onde for o cadastro
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            Começar Meu Mês Grátis <ArrowRight size={16} />
          </Link>

          <p className="text-center text-xs text-zinc-600 mt-4">
            Após 30 dias, apenas R$ 97,00/mês.
          </p>
        </div>
      </div>
    </div>
  );
}