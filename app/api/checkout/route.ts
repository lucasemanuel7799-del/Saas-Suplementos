import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

// Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Mapeamento de IDs de Preço do seu Stripe
const PRICE_IDS = {
  premium: {
    monthly: "price_1SmqQeRwULq0EosYdcU1SiRA",
    semiannual: "price_1SmqQeRwULq0EosYRvAsYmtx",
    yearly: "price_1SmqQeRwULq0EosYHgJprEPH",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, cycle } = body;

    // 1. Inicializa o cliente do Supabase para Server-Side
    const supabase = await createClient();
    
    // 2. Tenta obter o usuário logado de forma segura
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fallback: Se getUser falhar por latência, tenta recuperar via sessão
    let finalUserId = user?.id;
    let finalUserEmail = user?.email;

    if (!finalUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      finalUserId = session?.user?.id;
      finalUserEmail = session?.user?.email;
    }

    // LOG DE DEBUG: Verifique isso no terminal do seu VS Code
    console.log("🔍 Tentativa de Checkout:");
    console.log("- Usuário ID:", finalUserId || "NÃO IDENTIFICADO (Undefined)");
    console.log("- Plano:", plan, "Ciclo:", cycle);

    // Se mesmo assim não houver usuário, bloqueia a criação do checkout
    if (!finalUserId) {
      return NextResponse.json(
        { error: "Sessão expirada. Por favor, saia e entre novamente no sistema." }, 
        { status: 401 }
      );
    }

    // 3. Validação do Preço selecionado
    // @ts-ignore
    const priceId = PRICE_IDS[plan]?.[cycle];

    if (!priceId) {
      return NextResponse.json({ error: "Configuração de plano inválida." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // 4. Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      
      // METADADOS: Isso é o que o seu Webhook usará para atualizar a tabela 'stores'
      metadata: {
        storeId: finalUserId, 
      },
      
      customer_email: finalUserEmail || undefined,
      success_url: `${baseUrl}/admin?success=true`,
      cancel_url: `${baseUrl}/admin`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("❌ Erro no servidor (Checkout):", error.message);
    return NextResponse.json(
      { error: "Erro interno ao processar o checkout." }, 
      { status: 500 }
    );
  }
}