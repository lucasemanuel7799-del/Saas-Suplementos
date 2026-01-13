import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature") as string;

  let event: Stripe.Event;

  // 1. Validação de segurança do Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erro na assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const supabase = await createClient();

  // 2. Filtra eventos de pagamento e assinatura
  if (
    event.type === "checkout.session.completed" || 
    event.type === "customer.subscription.updated" ||
    event.type === "invoice.payment_succeeded"
  ) {
    const session = event.data.object as any;
    
    // --- BUSCA DO ID DO USUÁRIO (StoreId) ---
    let userId = session.metadata?.storeId;

    // Se não achou no objeto principal, tenta buscar dentro da assinatura
    if (!userId) {
      if (session.object === 'subscription') {
        userId = session.metadata?.storeId;
      } 
      else if (session.subscription) {
        try {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          userId = sub.metadata?.storeId;
        } catch (e) {
          console.error("⚠️ Falha ao buscar assinatura para recuperar ID.");
        }
      }
    }

    if (!userId) {
      console.log(`ℹ️ Evento ${event.type} ignorado: userId não encontrado.`);
      return NextResponse.json({ received: true });
    }

    console.log(`✅ Processando ID: ${userId} | Evento: ${event.type}`);

    // --- CÁLCULO DA DATA DE EXPIRAÇÃO (Suporta Mensal, Semestral, Anual) ---
    let endsAt: string;

    try {
      let subscription: any = null;

      // Recupera o objeto de assinatura completo
      if (session.object === 'subscription') {
        subscription = session;
      } else if (session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        subscription = await stripe.subscriptions.retrieve(subId);
      }

      if (subscription) {
        // TENTATIVA 1: Data oficial do Stripe
        if (subscription.current_period_end) {
          endsAt = new Date(subscription.current_period_end * 1000).toISOString();
          console.log(`📅 Data recebida do Stripe: ${endsAt}`);
        } 
        // TENTATIVA 2: Cálculo manual baseado no PLANO (Caso a data falhe)
        else if (subscription.plan) {
          console.warn("⚠️ Data direta ausente. Calculando pelo tipo de plano...");
          
          const now = new Date();
          const interval = subscription.plan.interval;       // 'month' ou 'year'
          const count = subscription.plan.interval_count || 1; // Quantidade (ex: 6 para semestral)

          if (interval === 'year') {
            now.setFullYear(now.getFullYear() + 1);
            console.log("📆 Plano ANUAL detectado. (+1 Ano)");
          } else if (interval === 'month') {
            now.setMonth(now.getMonth() + count); // Soma os meses (1 ou 6)
            console.log(`📆 Plano MENSAL/SEMESTRAL detectado. (+${count} Meses)`);
          } else {
            now.setDate(now.getDate() + 30); // Fallback padrão
          }
          
          endsAt = now.toISOString();
        } else {
          throw new Error("Dados do plano indisponíveis.");
        }
      } else {
        throw new Error("Assinatura não encontrada.");
      }

    } catch (error: any) {
      // TENTATIVA 3: Fallback final de segurança (30 dias)
      console.error(`🚨 Erro no cálculo: ${error.message}. Usando +30 dias de segurança.`);
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 30);
      endsAt = fallbackDate.toISOString();
    }

    // --- ATUALIZAÇÃO NO BANCO DE DADOS ---
    console.log("🔄 Atualizando Supabase...");

    // 1. Atualiza Stores
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .update({
        subscription_status: "active",
        subscription_ends_at: endsAt,
      })
      .eq("id", userId) // Lembra de confirmar se sua coluna é 'id' ou 'user_id'
      .select();

    // 2. Atualiza Users
    const { error: userError } = await supabase
      .from("users")
      .update({ subscription_status: "active" })
      .eq("id", userId);

    // Logs Finais
    if (storeError) {
      console.error("❌ Erro ao atualizar Stores:", storeError.message);
    } else {
      const affected = storeData?.length ?? 0;
      console.log(`📊 Status Stores: ${affected > 0 ? "ATUALIZADO COM SUCESSO" : "ID NÃO ENCONTRADO"}`);
    }

    if (storeData && storeData.length > 0) {
      console.log(`🚀 SUCESSO! Acesso liberado até ${endsAt}`);
    }
  }

  return NextResponse.json({ received: true });
}