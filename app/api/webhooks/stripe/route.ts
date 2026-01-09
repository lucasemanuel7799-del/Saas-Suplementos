import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server"; // Verifique se este caminho está correto

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, cycle } = body;

    // 1. Pegar a sessão do usuário no servidor
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // LOG DE DEBUG - Veja isso no terminal do VS Code
    console.log("USUÁRIO IDENTIFICADO NO CHECKOUT:", user?.id);

    if (authError || !user) {
      console.error("ERRO DE AUTENTICAÇÃO:", authError);
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // 2. Definir o Price ID (Use os seus IDs reais do Stripe aqui)
    const PRICE_IDS: any = {
      premium: {
        monthly: "price_1SmqQeRwULq0EosYdcU1SiRA",
        yearly: "price_1SmqQeRwULq0EosYHgJprEPH",
      },
    };

    const priceId = PRICE_IDS[plan]?.[cycle === 'annual' ? 'yearly' : cycle];

    if (!priceId) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // 3. Criar a sessão com METADADOS GARANTIDOS
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      
      // ESTA PARTE É A QUE ESTAVA FALTANDO NO SEU PAINEL DO STRIPE
      metadata: {
        storeId: user.id, // ID do Supabase
      },
      
      customer_email: user.email,
      success_url: `${baseUrl}/admin?success=true`,
      cancel_url: `${baseUrl}/admin`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("ERRO CRÍTICO NO CHECKOUT:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}