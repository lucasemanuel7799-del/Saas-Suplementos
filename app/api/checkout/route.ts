import { NextResponse } from "next/server";
import Stripe from "stripe";

// Inicializa o Stripe usando a chave secreta do arquivo .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  typescript: true,
  // A versão da API é omitida para usar a versão instalada no seu package.json
});

// --- MAPA DE PREÇOS ---
// Substitua os códigos abaixo pelos IDs reais do seu Dashboard do Stripe
const PRICE_IDS = {
  premium: {
    monthly: "price_1SmqQeRwULq0EosYdcU1SiRA",    // Cole o ID do plano de R$ 250 aqui
    semiannual: "price_1SmqQeRwULq0EosYRvAsYmtx", // Cole o ID do plano de R$ 1.250 aqui
    yearly: "price_1SmqQeRwULq0EosYHgJprEPH",     // Cole o ID do plano de R$ 2.500 aqui
  },
};

export async function POST(req: Request) {
  try {
    // 1. Pega os dados enviados pela Landing Page
    const body = await req.json();
    const { plan, cycle } = body; 

    // 2. Validação simples para garantir que os dados chegaram
    if (!plan || !cycle) {
      return NextResponse.json({ error: "Dados do plano incompletos." }, { status: 400 });
    }

    // 3. Encontra o ID do preço correto
    // @ts-ignore
    const selectedPlanGroup = PRICE_IDS[plan]; // Pega o grupo 'premium'
    
    if (!selectedPlanGroup) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 400 });
    }

    const priceId = selectedPlanGroup[cycle]; // Pega o ID específico (ex: monthly)

    if (!priceId) {
      return NextResponse.json({ error: "Ciclo de pagamento inválido." }, { status: 400 });
    }

    // 4. Cria a Sessão de Checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription", // Assinatura recorrente
      allow_promotion_codes: true, // Permite cupons de desconto
      
      // --- IMPORTANTE: PARA ONDE O USUÁRIO VAI DEPOIS DE PAGAR ---
      // Ele vai para a página de registro levando o ID da sessão para confirmarmos o pagamento
      success_url: `${process.env.NEXT_PUBLIC_URL}/admin/register?session_id={CHECKOUT_SESSION_ID}`,
      
      // Se ele cancelar, volta para a Landing Page
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/landing`,
    });

    // 5. Retorna a URL do Stripe para o Frontend redirecionar o usuário
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Erro no checkout:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar sessão de pagamento." }, 
      { status: 500 }
    );
  }
}