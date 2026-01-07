import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  typescript: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, sessionId } = body;

    if (!name || !email || !password || !sessionId) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // 1. Recuperar sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 400 });
    }

    // 2. Recuperar assinatura e tratar data
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // @ts-ignore
    const periodEnd = subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const expiresAt = new Date(periodEnd * 1000).toISOString();

    // 3. Criar ou Recuperar usuário no Auth
    // O admin.createUser falha se já existir, então usamos um try/catch interno ou verificamos o erro
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    // Se o erro for de usuário já existente, não travamos o processo, apenas seguimos para o upsert
    if (authError && !authError.message.includes("already registered")) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Precisamos do ID do usuário. Se o createUser falhou por já existir, buscamos o ID pelo email.
    let userId = authData.user?.id;
    if (!userId) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      userId = existingUser.users.find(u => u.email === email)?.id;
    }

    if (!userId) return NextResponse.json({ error: "Erro ao identificar usuário." }, { status: 400 });

    // 4. UPSERT na tabela 'users' (O segredo para não dar erro de duplicata)
    const { error: dbError } = await supabase
      .from('users') 
      .upsert({
        id: userId,
        email: email,
        full_name: name,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        subscription_ends_at: expiresAt,
      }, { onConflict: 'id' });

    if (dbError) {
      return NextResponse.json({ error: "Erro no banco: " + dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}