"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  BarChart3, 
  Smartphone, 
  Check, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Loader2,
  Star
} from "lucide-react";

// Definição dos tipos para os ciclos
type BillingCycle = 'monthly' | 'semiannual' | 'yearly';

export default function LandingPage() {
  const router = useRouter();
  
  // Estado para controlar qual botão está carregando
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Estado para o ciclo de pagamento
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  // Refs para scroll suave
  const heroRef = useRef<HTMLDivElement | null>(null);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  // Mapa de Preços para exibição (PLANO ÚNICO)
  const priceConfig = {
    monthly: { value: "250", label: "/mês", savings: null },
    semiannual: { value: "1.250", label: "/semestre", savings: "Economize com 6 meses garantidos" },
    yearly: { value: "2.500", label: "/ano", savings: "Melhor valor: ganhe 2 meses grátis (R$ 208/mês)" },
  };

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Função que chama o Stripe
  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      // Chama sua API Backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'premium', // Nome fixo do seu plano único
          cycle: billingCycle, // Envia o ciclo escolhido (mensal/semestral/anual)
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url; // Redireciona para o Stripe
      } else {
        console.error("Erro:", data);
        alert("Erro ao iniciar pagamento. Verifique o console.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#09090b] min-h-screen w-full text-zinc-100 font-sans selection:bg-blue-500/30">
      
      {/* --- HEADER --- */}
      <header className="fixed w-full z-50 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <button
            className="font-extrabold text-2xl text-blue-500 hover:opacity-90 tracking-tight transition-opacity"
            onClick={() => scrollTo(heroRef)}
            style={{ letterSpacing: '-0.03em' }}
          >
            Suple<span className="text-white">SaaS</span>
          </button>

          <div className="hidden md:flex space-x-8 text-zinc-400 font-medium text-sm">
            <button className="hover:text-blue-400 transition-colors" onClick={() => scrollTo(featuresRef)}>
              Funcionalidades
            </button>
            <button className="hover:text-blue-400 transition-colors" onClick={() => scrollTo(plansRef)}>
              Planos
            </button>
            <button className="hover:text-blue-400 transition-colors" onClick={() => scrollTo(faqRef)}>
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              className="hidden sm:block text-zinc-300 hover:text-white text-sm font-semibold transition-colors"
              onClick={() => router.push("/admin/login")}
            >
              Entrar
            </button>
            <button 
              className="rounded-full bg-blue-600 px-5 py-2 text-white text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              onClick={() => router.push("/admin/register")}
            >
              Criar Conta
            </button>
          </div>
        </div>
        
        {/* Navbar Mobile */}
        <div className="md:hidden flex border-t border-zinc-800 bg-[#09090b]">
          <button className="flex-1 py-3 text-xs text-zinc-400 hover:text-white" onClick={() => scrollTo(featuresRef)}>Funcionalidades</button>
          <button className="flex-1 py-3 text-xs text-zinc-400 hover:text-white" onClick={() => scrollTo(plansRef)}>Planos</button>
          <button className="flex-1 py-3 text-xs text-zinc-400 hover:text-white" onClick={() => scrollTo(faqRef)}>FAQ</button>
        </div>
      </header>

      {/* --- HERO --- */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium text-blue-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Nova versão 2.0 disponível
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl">
            Sua loja de suplementos <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              no piloto automático
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed">
            Gestione estoque, vendas e clientes em um único lugar. 
            A plataforma completa para escalar seu negócio de suplementos sem dor de cabeça.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-4 text-lg transition-all active:scale-95 shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
              onClick={() => scrollTo(plansRef)}
            >
              Começar Agora <ArrowRight size={20} />
            </button>
            <button 
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-800 hover:text-white transition-all rounded-xl px-8 py-4 text-lg active:scale-95"
              onClick={() => scrollTo(featuresRef)}
            >
              Ver Demonstração
            </button>
          </div>

          <div className="pt-8 flex items-center gap-4 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-zinc-800" />
              ))}
            </div>
            <p>+500 lojas confiam no SupleSaaS</p>
          </div>
        </div>
      </section>

      {/* --- FUNCIONALIDADES --- */}
      <section ref={featuresRef} className="py-24 bg-[#0c0c10] border-y border-zinc-800/50" id="funcionalidades">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Tudo o que você precisa</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Ferramentas poderosas desenvolvidas especificamente para o mercado de suplementação e saúde.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShoppingBag className="text-blue-500" size={32} />}
              title="Loja Online Pronta"
              description="Seu catálogo disponível 24h por dia. Design otimizado para conversão em mobile e desktop."
            />
            <FeatureCard 
              icon={<Smartphone className="text-blue-500" size={32} />}
              title="Venda no WhatsApp"
              description="Envie links de checkout direto para seus clientes e feche vendas mais rápido pelo chat."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-blue-500" size={32} />}
              title="Gestão de Estoque"
              description="Controle de validade, lotes e reposição automática. Nunca mais perca produtos vencidos."
            />
            <FeatureCard 
              icon={<Zap className="text-blue-500" size={32} />}
              title="Alta Performance"
              description="Site ultrarrápido carregado em milissegundos, garantindo que seu cliente não abandone a compra."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-blue-500" size={32} />}
              title="Checkout Seguro"
              description="Integração com os principais gateways de pagamento do mercado com total segurança."
            />
            <FeatureCard 
              icon={<HelpCircle className="text-blue-500" size={32} />}
              title="Suporte Especializado"
              description="Nossa equipe entende do seu negócio e está pronta para ajudar você a vender mais."
            />
          </div>
        </div>
      </section>

      {/* --- PLANO ÚNICO --- */}
      <section ref={plansRef} className="py-24 px-4 relative overflow-hidden" id="planos">
        {/* Background glow */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] -z-10" />

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-8">
            Acesso Total à Plataforma
          </h2>
          <p className="text-zinc-400 text-center max-w-lg mb-12">
            Um único plano com todas as funcionalidades liberadas. Escolha o ciclo de pagamento que melhor se adapta ao seu fluxo de caixa.
          </p>

          {/* Seletor de Ciclo de Pagamento */}
          <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex mb-12 relative shadow-lg overflow-x-auto max-w-full">
            {(['monthly', 'semiannual', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`whitespace-nowrap px-4 sm:px-8 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
                  billingCycle === cycle 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cycle === 'monthly' && 'Mensal'}
                {cycle === 'semiannual' && 'Semestral'}
                {cycle === 'yearly' && 'Anual'}
              </button>
            ))}
          </div>
          
          {/* CARD DO PLANO (Largo e Destaque) */}
          <div className="relative w-full max-w-lg rounded-3xl border border-blue-500/50 bg-zinc-900/80 p-8 sm:p-12 flex flex-col items-center shadow-2xl shadow-blue-900/20">
            
            {/* Tag de Economia (só aparece se tiver) */}
            {priceConfig[billingCycle].savings && (
              <div className="absolute -top-4 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow-lg">
                {priceConfig[billingCycle].savings}
              </div>
            )}

            <div className="bg-blue-500/10 p-4 rounded-full mb-6">
              <Star className="text-blue-400 w-8 h-8 fill-blue-400/20" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Plano Premium</h3>
            <p className="text-zinc-400 text-sm mb-8">Todas as funcionalidades desbloqueadas</p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-zinc-400 text-2xl font-medium">R$</span>
              <span className="text-6xl font-black text-white tracking-tighter">
                {priceConfig[billingCycle].value}
              </span>
              <span className="text-zinc-500 text-lg font-medium">
                {priceConfig[billingCycle].label}
              </span>
            </div>

            <div className="w-full bg-zinc-800/50 rounded-xl p-6 mb-8 border border-zinc-800">
              <ul className="space-y-4">
                <PlanItem text="Produtos e Vendas Ilimitadas" checked />
                <PlanItem text="Domínio Próprio (.com.br)" checked />
                <PlanItem text="Integração WhatsApp + Gateway" checked />
                <PlanItem text="Painel Financeiro Completo" checked />
                <PlanItem text="Suporte Prioritário" checked />
                <PlanItem text="Backup Diário Automático" checked />
              </ul>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Assinar Agora"}
            </button>
            
            <p className="mt-4 text-zinc-500 text-xs text-center">
              Satisfação garantida ou seu dinheiro de volta em 7 dias.
            </p>
          </div>

        </div>
      </section>

      {/* --- FAQ --- */}
      <section ref={faqRef} className="py-24 px-4 bg-[#0c0c10]" id="faq">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold mb-12 text-center text-white">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <FaqItem 
              question="Posso cancelar a qualquer momento?"
              answer="Sim! Não há contrato de fidelidade no plano mensal. Você pode cancelar quando quiser através do painel."
            />
            <FaqItem 
              question="O que acontece depois que eu assinar?"
              answer="Você receberá acesso imediato ao painel administrativo e nossa equipe entrará em contato para agendar o setup inicial se necessário."
            />
            <FaqItem 
              question="Tenho desconto pagando por ano?"
              answer="Sim! O plano anual custa R$ 2.500, o que equivale a R$ 208 por mês. Uma economia de quase 20% comparado ao mensal."
            />
            <FaqItem 
              question="Vocês cobram taxa sobre as vendas?"
              answer="Não! O valor da assinatura é fixo. Não cobramos comissão sobre suas vendas, apenas as taxas padrão do seu gateway de pagamento (cartão/pix)."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-zinc-800 bg-[#09090b] pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-2xl font-extrabold text-blue-500 tracking-tight">
              Suple<span className="text-white">SaaS</span>
            </span>
            <p className="mt-4 text-zinc-500 text-sm max-w-sm leading-relaxed">
              A plataforma líder para empreendedores do mercado de suplementação. 
              Tecnologia de ponta para quem leva performance a sério.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><button onClick={() => scrollTo(featuresRef)} className="hover:text-blue-400">Funcionalidades</button></li>
              <li><button onClick={() => scrollTo(plansRef)} className="hover:text-blue-400">Preços</button></li>
              <li><button onClick={() => scrollTo(faqRef)} className="hover:text-blue-400">FAQ</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-blue-400">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-blue-400">Privacidade</a></li>
              <li><a href="#" className="hover:text-blue-400">Contato</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-zinc-800 text-center text-zinc-600 text-sm">
          &copy; {new Date().getFullYear()} SupleSaaS Ltda. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 transition-all hover:bg-zinc-900">
      <div className="mb-4 p-3 rounded-lg bg-black border border-zinc-800 w-fit group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function PlanItem({ text, checked = false }: { text: string, checked?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-sm text-zinc-300">
      <div className={`flex items-center justify-center w-5 h-5 rounded-full ${checked ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
        <Check size={12} strokeWidth={3} />
      </div>
      {text}
    </li>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-700 transition-colors">
      <h3 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
        <HelpCircle size={18} className="text-blue-500" />
        {question}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed pl-7">
        {answer}
      </p>
    </div>
  );
}