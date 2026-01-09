"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Store, Smartphone, Zap, ShieldCheck, Rocket, BarChart3, Package, Check, HelpCircle,
  Tag, Share2, RefreshCw, Globe, Layers, Printer, MapPin, TrendingUp, Headphones, Crown, Timer, Loader2
} from "lucide-react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  // ESTADO PARA O CICLO DE PAGAMENTO (padrao: mensal)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semiannual" | "yearly">("monthly");

  // DADOS VISUAIS DOS PREÇOS
  const pricingOptions = {
    monthly: {
      value: "250",
      period: "/mês",
      description: "Cobrado mensalmente. Cancele quando quiser.",
      badge: null
    },
    semiannual: {
      value: "1.250",
      period: "/semestre",
      description: "Equivalente a R$ 208/mês. Economize R$ 250.",
      badge: "DESCONTO"
    },
    yearly: {
      value: "2.500",
      period: "/ano",
      description: "Equivalente a R$ 208/mês. 2 Meses Grátis!",
      badge: "MELHOR VALOR"
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      });
    }
  };

  // FUNÇÃO DE PAGAMENTO ATUALIZADA
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      // Agora enviamos o PLANO e o CICLO escolhido pelo usuário
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "premium",      // Nome do grupo no seu backend
          cycle: billingCycle,  // 'monthly', 'semiannual' ou 'yearly'
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao iniciar pagamento: " + (data.error || "Desconhecido"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
      setIsLoading(false);
    }
  };

  const featuresList = [
    { icon: Smartphone, title: "Mobile First", desc: "Catálogo perfeito em qualquer celular." },
    { icon: Zap, title: "Estoque Real", desc: "Baixa automática a cada venda realizada." },
    { icon: ShieldCheck, title: "Gestão Financeira", desc: "Relatórios de lucro e vendas diárias." },
    { icon: Tag, title: "Cupons de Desconto", desc: "Crie promoções para vender mais." },
    { icon: Share2, title: "Pixel do Facebook", desc: "Integração pronta para seus anúncios." },
    { icon: RefreshCw, title: "Recuperação", desc: "Lembrete automático de carrinho abandonado." },
    { icon: Globe, title: "Domínio Próprio", desc: "Use seu site .com.br profissional." },
    { icon: Layers, title: "Variações", desc: "Venda por sabor, tamanho ou peso." },
    { icon: Printer, title: "Impressão", desc: "Imprima pedidos direto para a separação." },
    { icon: MapPin, title: "Taxa por Bairro", desc: "Frete dinâmico calculado por região." },
    { icon: TrendingUp, title: "Top Produtos", desc: "Saiba o que mais vende na sua loja." },
    { icon: Headphones, title: "Suporte VIP", desc: "Atendimento direto pelo WhatsApp." },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-100 selection:bg-orange-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute right-0 top-20 -z-10 h-[500px] w-[500px] rounded-full bg-orange-600 opacity-20 blur-[120px]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              <Store size={20} />
            </div>
            SuppleS
          </div>
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-medium text-zinc-400 hover:text-white hover:scale-105 transition-all cursor-pointer">Funcionalidades</a>
            <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-zinc-400 hover:text-white hover:scale-105 transition-all cursor-pointer">Planos</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-sm font-medium text-zinc-400 hover:text-white hover:scale-105 transition-all cursor-pointer">FAQ</a>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin/login" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Entrar</Link>
            <Link href="/admin/register" className="bg-white text-zinc-950 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] flex items-center gap-2">
              Teste Grátis
              <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wide">30 Dias</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 min-h-screen flex items-center pt-20 px-6 snap-start">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          <div className="space-y-6 text-center lg:text-left mt-10 lg:mt-0">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-950/30 border border-orange-500/30 text-xs font-bold text-orange-400 uppercase tracking-widest shadow-[0_0_10px_rgba(249,115,22,0.2)] mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Plataforma SuppleS v1.0
             </div>
             <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] drop-shadow-2xl">
                O sistema definitivo para sua <br />
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
                  loja de suplementos.
                </span>
             </h1>
             <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Crie um catálogo online profissional em minutos. Gerencie estoque, receba pedidos no WhatsApp e fidelize clientes.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/register" className="w-full sm:w-auto bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(234,88,12,0.4)] hover:shadow-[0_0_40px_-5px_rgba(234,88,12,0.6)] hover:-translate-y-1">
                  <Timer size={20} /> Teste Grátis (1 Mês) 
                </Link>
                <a href="#demo" onClick={(e) => scrollToSection(e, 'features')} className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-all border border-white/10 cursor-pointer text-center">Ver Demo</a>
             </div>
             <p className="text-xs text-zinc-500 font-medium pt-2">* Não é necessário cartão de crédito para testar.</p>
          </div>
          <div className="relative perspective-1000 w-full max-w-lg mx-auto lg:max-w-none">
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-600 to-purple-600 blur-[80px] opacity-20 rounded-full transform translate-x-10 translate-y-10"></div>
             <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl transform lg:rotate-y-[-5deg] lg:rotate-x-[5deg] transition-transform hover:rotate-0 duration-500 group">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 px-2">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"/>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                      <div className="w-3 h-3 rounded-full bg-green-500"/>
                   </div>
                   <div className="text-[10px] text-zinc-500 font-mono">dashboard.supples.com</div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-zinc-400 mb-2 text-xs uppercase font-bold"><BarChart3 size={14} className="text-orange-500"/> Faturamento</div>
                      <div className="text-2xl font-bold text-white">R$ 1.250,00</div>
                      <div className="text-xs text-green-500 mt-1 flex items-center gap-1"><Rocket size={10}/> +15%</div>
                   </div>
                   <div className="bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-zinc-400 mb-2 text-xs uppercase font-bold"><Package size={14} className="text-blue-500"/> Pedidos</div>
                      <div className="text-2xl font-bold text-white">12</div>
                      <div className="text-xs text-zinc-500 mt-1">Pendentes</div>
                   </div>
                </div>
                <div className="bg-zinc-950/50 rounded-xl border border-white/5 p-4 space-y-3">
                   <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Últimas Vendas</div>
                   {[1, 2].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center"><Package size={14} className="text-zinc-500"/></div>
                            <div><div className="text-sm font-medium text-white">Whey Protein Isolado</div></div>
                         </div>
                         <div className="text-sm font-bold text-orange-500">R$ 149,90</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FUNCIONALIDADES --- */}
      <section id="features" className="relative z-10 min-h-screen flex items-center py-16 bg-zinc-950 snap-start">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-black text-white mb-2">Poder Total</h2>
             <p className="text-zinc-400 max-w-2xl mx-auto">
               Todas as ferramentas que você precisa em um só lugar.
             </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuresList.map((feature, i) => (
              <div key={i} className="bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all group hover:bg-zinc-900/60 hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">{feature.title}</h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PLANOS (COM SELETOR DE CICLO) --- */}
      <section id="pricing" className="relative z-10 min-h-screen flex items-center py-20 bg-zinc-900/30 border-y border-white/5 snap-start">
        <div className="max-w-7xl mx-auto px-6 w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             
             {/* CARD DO PLANO */}
             <div className="relative max-w-sm mx-auto lg:mx-0 w-full">
                <div className="absolute inset-0 bg-orange-600 blur-[60px] opacity-10 rounded-full"></div>
                
                <div className="bg-zinc-900 p-5 rounded-3xl border border-orange-500/50 shadow-[0_0_30px_-10px_rgba(249,115,22,0.2)] relative flex flex-col hover:scale-[1.02] transition-transform duration-500 group">
                    
                    {/* Badge do Ciclo (Se tiver) */}
                    {pricingOptions[billingCycle].badge && (
                       <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[22px] shadow-lg animate-pulse">
                          {pricingOptions[billingCycle].badge}
                       </div>
                    )}

                    {/* SELETOR DE CICLO */}
                    <div className="bg-zinc-950 p-1 rounded-xl flex items-center justify-between mb-6 border border-white/5 relative z-10">
                       {(['monthly', 'semiannual', 'yearly'] as const).map((cycle) => (
                          <button
                            key={cycle}
                            onClick={() => setBillingCycle(cycle)}
                            className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
                               billingCycle === cycle 
                               ? 'bg-orange-600 text-white shadow-md' 
                               : 'text-zinc-500 hover:text-white'
                            }`}
                          >
                             {cycle === 'monthly' ? 'Mensal' : cycle === 'semiannual' ? 'Semestral' : 'Anual'}
                          </button>
                       ))}
                    </div>
                    
                    <div className="mb-5">
                       <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-500 mb-3 border border-orange-500/20 shadow-inner group-hover:rotate-12 transition-transform">
                          <Crown size={20} />
                       </div>
                       <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Plano SuppleS Pro</span>
                       
                       {/* Preço Dinâmico */}
                       <div className="text-4xl font-black text-white mt-1 tracking-tight">
                          R$ {pricingOptions[billingCycle].value}
                          <span className="text-base font-medium text-zinc-500 tracking-normal">{pricingOptions[billingCycle].period}</span>
                       </div>
                       
                       {/* Descrição Dinâmica */}
                       <p className="text-zinc-400 text-[10px] mt-1 font-medium min-h-[1.5em]">
                          {pricingOptions[billingCycle].description}
                       </p>
                    </div>

                    <div className="space-y-2 mb-6 flex-1 border-t border-white/5 pt-4">
                       {[
                          "Produtos Ilimitados", 
                          "Domínio Próprio Incluso", 
                          "0% de Taxa por Venda", 
                          "Painel Completo", 
                          "Suporte WhatsApp"
                       ].map(item => (
                          <div key={item} className="flex items-center gap-3 text-white text-sm font-medium">
                             <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <Check size={10} strokeWidth={3}/>
                             </div>
                             {item}
                          </div>
                       ))}
                    </div>

                    <button 
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 rounded-xl font-bold text-center text-sm hover:brightness-110 transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {isLoading ? (
                         <>
                           <Loader2 size={16} className="animate-spin" /> Processando...
                         </>
                       ) : (
                         <>
                           <Crown size={16}/> Assinar Agora
                         </>
                       )}
                    </button>
                </div>
             </div>

             {/* TEXTO DIREITA */}
             <div className="lg:pl-8 text-center lg:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                   Por que apenas <br />
                   <span className="text-zinc-500">um único plano?</span>
                </h2>
                <div className="space-y-6 text-base md:text-lg text-zinc-400 leading-relaxed">
                   <p>
                      Nós não acreditamos em limitar o seu crescimento. Em outras plataformas, você precisa pagar mais caro para ter acesso a funcionalidades básicas como "cupom de desconto" ou "domínio próprio".
                   </p>
                   <p>
                      <strong className="text-white">Aqui no SuppleS, o jogo é limpo.</strong>
                   </p>
                   <p>
                      Criamos um único plano que entrega a ferramenta completa, com força total, desde o primeiro dia. Escolha o ciclo que cabe no seu bolso: mensal para flexibilidade ou anual para economia máxima.
                   </p>
                   <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mt-4 inline-block">
                      <p className="text-orange-400 text-sm font-bold flex items-center gap-2">
                        <Timer size={16}/> Quer testar antes? Use o botão no topo da página.
                      </p>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="relative z-10 min-h-screen flex items-center py-20 bg-zinc-950 snap-start">
         <div className="max-w-3xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-white mb-4">Perguntas Frequentes</h2>
               <p className="text-zinc-400">Tire suas dúvidas antes de começar.</p>
            </div>
            <div className="space-y-4">
               {[
                  { q: "O teste de 30 dias é realmente grátis?", a: "Sim! Você tem acesso total à plataforma por 1 mês inteiro. Se não gostar, pode cancelar sem pagar nada." },
                  { q: "Preciso pagar comissão por venda?", a: "Não! Diferente dos marketplaces, nós não cobramos nenhuma taxa sobre seus pedidos. O lucro é 100% seu." },
                  { q: "Como recebo os pedidos?", a: "Os pedidos chegam instantaneamente no seu WhatsApp com todos os detalhes e também ficam salvos no seu painel administrativo." },
               ].map((item, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900 transition-colors">
                     <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-2"><HelpCircle size={18} className="text-zinc-500"/> {item.q}</h3>
                     <p className="text-zinc-400 leading-relaxed pl-7">{item.a}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-12 bg-zinc-950 relative z-10 snap-start">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center text-white text-xs"><Store size={12} /></div>
            SuppleS
          </div>
          <p className="text-sm text-zinc-500 font-medium">&copy; 2026 SuppleS Inc.</p>
        </div>
      </footer>

    </div>
  );
}