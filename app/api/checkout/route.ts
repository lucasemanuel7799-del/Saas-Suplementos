import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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

    // 1. Instanciar o Supabase com suporte a cookies
    const supabase = await createClient();

    // 2. Tentar obter o usuário de duas formas para garantir a captura
    const { data: { user } } = await supabase.auth.getUser();
    
    // Se o getUser falhar, tentamos pegar da sessão ativa
    let finalUserId = user?.id;
    let finalUserEmail = user?.email;

    if (!finalUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      finalUserId = session?.user?.id;
      finalUserEmail = session?.user?.email;
    }

    // LOG DE DEBUG PARA O TERMINAL
    console.log("🔍 Tentativa de identificação do usuário:");
    console.log("- User ID capturado:", finalUserId);

    // 3. Se ainda assim for undefined, bloqueamos o checkout
    if (!finalUserId) {
      console.error("❌ ERRO: Sessão de usuário não encontrada no servidor.");
      return NextResponse.json(
        { error: "Você precisa estar logado para assinar." }, 
        { status: 401 }
      );
    }

    if (!plan || !cycle) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // @ts-ignore
    const priceId = PRICE_IDS[plan]?.[cycle === 'annual' ? 'yearly' : cycle];

    if (!priceId) {
      return NextResponse.json({ error: "Preço não encontrado." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // 4. Criar a sessão no Stripe com os Metadados validados
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      
      metadata: {
        storeId: finalUserId, // Aqui garantimos que não irá 'undefined'
      },
      
      customer_email: finalUserEmail || undefined,
      success_url: `${baseUrl}/admin?success=true`,
      cancel_url: `${baseUrl}/admin`,
    });

    console.log("✅ Sessão de Checkout criada com sucesso para:", finalUserId);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("❌ Erro crítico no checkout:", error.message);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}