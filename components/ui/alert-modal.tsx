"use client";

import { AlertTriangle, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  description: string;
}

export const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
}: AlertModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all">
      {/* Container do Modal */}
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all">
        
        {/* Botão Fechar (X) */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>

        {/* Conteúdo */}
        <div className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
            <div className="mb-2 rounded-full bg-red-900/20 p-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-zinc-400">
                {description}
            </p>
        </div>

        {/* Botões de Ação */}
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <button
                disabled={loading}
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none disabled:opacity-50"
            >
                Cancelar
            </button>
            <button
                disabled={loading}
                onClick={onConfirm}
                className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none disabled:opacity-50"
            >
                {loading ? "Excluindo..." : "Sim, excluir"}
            </button>
        </div>
      </div>
    </div>
  );
};