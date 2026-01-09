import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erro na assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const supabase = await createClient();

  // EVENTO: Assinatura Criada ou Atualizada com Sucesso
  if (event.type === "checkout.session.completed" || event.type === "customer.subscription.updated") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Recupera o ID do usuário que guardamos nos metadados lá no Checkout
    const userId = session.metadata?.storeId;

    if (!userId) {
      console.error("❌ Erro: userId não encontrado nos metadados da sessão.");
      return NextResponse.json({ error: "No userId in metadata" }, { status: 400 });
    }

    console.log(`✅ Processando pagamento para o usuário: ${userId}`);

    // Calcula a data de expiração (normalmente 30 dias para mensal ou 1 ano)
    // O Stripe envia isso em 'current_period_end'
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const endsAt = new Date(subscription.current_period_end * 1000).toISOString();

    // 1. Atualiza a tabela STORES
    const { error: storeError } = await supabase
      .from("stores")
      .update({
        subscription_status: "active",
        subscription_ends_at: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // 2. Atualiza a tabela USERS (Se você tiver a coluna lá)
    const { error: userError } = await supabase
      .from("users")
      .update({
        subscription_status: "active",
      })
      .eq("id", userId);

    if (storeError || userError) {
      console.error("❌ Erro ao atualizar banco de dados:", storeError || userError);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log(`🚀 Acesso liberado com sucesso para ${userId} até ${endsAt}`);
  }

  return NextResponse.json({ received: true });
}