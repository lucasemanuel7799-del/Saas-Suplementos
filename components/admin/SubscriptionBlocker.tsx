"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  ShieldAlert, CheckCircle2, Crown, Calendar, 
  CreditCard, Lock, Loader2 
} from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionBlocker() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'active' | 'trial_active' | 'expired_trial' | 'expired_sub'>('active');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semiannual' | 'annual'>('annual');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca dados da loja
    const { data: store } = await supabase
      .from('stores')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single();

    if (!store) return;

    const now = new Date();
    const trialEnd = store.trial_ends_at ? new Date(store.trial_ends_at) : null;
    const subEnd = store.subscription_ends_at ? new Date(store.subscription_ends_at) : null;

    // Lógica de Status
    // 1. Assinatura Ativa
    if (store.subscription_status === 'active' && subEnd && subEnd > now) {
        setStatus('active');
    } 
    // 2. Trial Ativo
    else if (store.subscription_status === 'trial' && trialEnd && trialEnd > now) {
        setStatus('trial_active');
    }
    // 3. Trial Expirado (Nunca pagou)
    else if (store.subscription_status === 'trial') {
        setStatus('expired_trial');
    }
    // 4. Assinatura Expirada/Cancelada (Já pagou antes)
    else {
        setStatus('expired_sub');
    }

    setLoading(false);
  }

  // Integração Real com o Stripe via sua rota /api/checkout
  const handleCheckout = async () => {
    setProcessing(true);
    
    try {
      // Mapeia 'annual' para 'yearly' para bater com o seu PRICE_IDS do route.ts
      const cycle = selectedPlan === 'annual' ? 'yearly' : selectedPlan;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          plan: "premium", // Seu PRICE_IDS espera o grupo 'premium'
          cycle: cycle 
        }),
      });

      const data = await response.json();

      if (data.url) {
        toast.success("Redirecionando para o pagamento seguro...");
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Erro ao gerar checkout");
      }
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error(error.message || "Não foi possível iniciar o pagamento.");
      setProcessing(false);
    }
  };

  // Se estiver tudo ok ou carregando, não mostra nada
  if (loading || status === 'active' || status === 'trial_active') {
    return null; 
  }

  const isRenovation = status === 'expired_sub';

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Lado Esquerdo: A Mensagem */}
        <div className="p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-600" />
            
            <div className="mb-6 h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                <Lock size={32} className="text-red-500" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
                {isRenovation ? "Sua assinatura expirou." : "Seu período de teste acabou."}
            </h1>
            
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                {isRenovation 
                    ? "Para continuar gerenciando sua loja e vendendo, renove sua assinatura agora. Seus dados estão salvos e seguros."
                    : "Espero que tenha gostado da Supples! Para continuar vendendo e desbloquear todos os recursos, escolha um plano abaixo."
                }
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span>PDV e Controle de Estoque Ilimitado</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span>Gestão Financeira Completa</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="text-emerald-500" size={20} />
                    <span>Cardápio Digital e Cupons</span>
                </div>
            </div>
        </div>

        {/* Lado Direito: Os Planos */}
        <div className="bg-zinc-950 p-8 lg:p-12 border-l border-zinc-800 flex flex-col justify-center">
            
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <Crown size={20} className="text-orange-500" /> Escolha o melhor plano
            </h2>

            <div className="space-y-4 mb-8">
                {/* Plano Mensal */}
                <label className={`cursor-pointer block relative p-4 rounded-xl border-2 transition-all ${selectedPlan === 'monthly' ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'}`}>
                    <input type="radio" name="plan" className="hidden" onChange={() => setSelectedPlan('monthly')} checked={selectedPlan === 'monthly'} />
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">Mensal</p>
                            <p className="text-xs text-zinc-500">Cobrado todo mês</p>
                        </div>
                        <p className="font-bold text-xl text-white">R$ 250<span className="text-sm text-zinc-500">/mês</span></p>
                    </div>
                </label>

                {/* Plano Semestral */}
                <label className={`cursor-pointer block relative p-4 rounded-xl border-2 transition-all ${selectedPlan === 'semiannual' ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'}`}>
                    <input type="radio" name="plan" className="hidden" onChange={() => setSelectedPlan('semiannual')} checked={selectedPlan === 'semiannual'} />
                    <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MELHOR CUSTO</div>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">Semestral</p>
                            <p className="text-xs text-zinc-500">Cobrado a cada 6 meses</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xl text-white">R$ 208<span className="text-sm text-zinc-500">/mês</span></p>
                            <p className="text-[10px] text-zinc-500 line-through">Total R$ 1.250</p>
                        </div>
                    </div>
                </label>

                {/* Plano Anual */}
                <label className={`cursor-pointer block relative p-4 rounded-xl border-2 transition-all ${selectedPlan === 'annual' ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'}`}>
                    <input type="radio" name="plan" className="hidden" onChange={() => setSelectedPlan('annual')} checked={selectedPlan === 'annual'} />
                    <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown size={10} fill="currentColor" /> MAIS POPULAR
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">Anual</p>
                            <p className="text-xs text-zinc-500">Cobrado uma vez ao ano</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xl text-white">R$ 208<span className="text-sm text-zinc-500">/mês</span></p>
                            <p className="text-[10px] text-zinc-500 line-through">Total R$ 2.500</p>
                        </div>
                    </div>
                </label>
            </div>

            <button 
                onClick={handleCheckout}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-xl text-lg shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {processing ? <Loader2 className="animate-spin" /> : (isRenovation ? <CheckCircle2 /> : <CreditCard />)}
                {processing ? "Iniciando..." : (isRenovation ? "RENOVAR ASSINATURA" : "ASSINAR AGORA")}
            </button>

            <p className="text-center text-xs text-zinc-600 mt-4 flex items-center justify-center gap-1">
                <Lock size={10} /> Pagamento seguro via Stripe
            </p>
        </div>
      </div>
    </div>
  );
}