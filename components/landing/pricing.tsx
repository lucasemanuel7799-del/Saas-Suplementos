"use client";

import { Check, Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function PricingSection() {
  const [isProcessing, setIsProcessing] = useState(false);

  // Função Atualizada para o Stripe
  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "premium",
          cycle: "monthly", // Plano padrão da landing page
        }),
        // ESSENCIAL: Envia os cookies para o servidor identificar o usuário logado
        credentials: "include",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Se o erro for 401 (não logado), redireciona para login
        if (response.status === 401) {
          toast.error("Você precisa estar logado para assinar.");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(data.error || "Erro ao iniciar checkout");
      }
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error(error.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="precos" className="py-24 bg-black relative overflow-hidden">
      
      {/* Efeito de Fundo (Glow) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Um único plano, <span className="text-blue-500">tudo incluído.</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Sem limites de usuários, sem taxas escondidas. Tudo o que você precisa para gerenciar sua loja de suplementos.
          </p>
        </div>

        {/* CARD PLANO ÚNICO */}
        <div className="max-w-lg mx-auto bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl hover:border-blue-500/30 transition-all duration-300">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-medium text-zinc-300">Plano Pro</h3>
              <p className="text-sm text-zinc-500 mt-1">Acesso total ao sistema</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">R$ 97</span>
                <span className="text-zinc-500">/mês</span>
              </div>
            </div>
          </div>

          {/* Botão de Assinatura Atualizado */}
          <button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20 mb-8 group disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Zap size={20} className="fill-white" />
            )}
            {isProcessing ? "Processando..." : "Assinar Agora"}
          </button>

          {/* Lista de Features */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">O que está incluso:</p>
            
            {[
              "Gestão de Pedidos Ilimitada",
              "Controle de Estoque em Tempo Real",
              "Dashboard Financeiro Completo",
              "Cadastro de Clientes e Fornecedores",
              "Suporte Prioritário via WhatsApp",
              "Atualizações Semanais",
              "Backup Automático Diário"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check size={12} className="text-green-500" />
                </div>
                <span className="text-zinc-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-zinc-600">
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </div>

      </div>
    </section>
  );
}