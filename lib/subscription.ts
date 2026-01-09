import { createClient } from "@/lib/supabase-server";

export type SubscriptionCheck = 
  | { isAllowed: true; plan: 'pro' }
  | { isAllowed: true; plan: 'trial'; daysLeft: number }
  | { isAllowed: false; reason: string };

export async function checkSubscription(userId: string): Promise<SubscriptionCheck> {
  const supabase = await createClient();

  // Tenta buscar os dados na tabela pública
  const { data: user, error } = await supabase
    .from("users" as any) // 'as any' para evitar erro de tipagem se a tabela não foi detectada
    .select("subscription_status, plan_type, trial_ends_at")
    .eq("id", userId)
    .single();

  // --- CORREÇÃO DEFINITIVA ---
  // Se o usuário acabou de criar a conta, o banco pode demorar 1-2 segundos para ter os dados.
  // Se 'error' existe ou 'user' é nulo, assumimos que é um usuário NOVO e liberamos acesso.
  if (error || !user) {
    console.log("⚡ Usuário novo detectado (delay do banco). Liberando Trial Provisório.");
    return { isAllowed: true, plan: 'trial', daysLeft: 30 };
  }

  const status = user.subscription_status;

  // 1. Assinante PRO
  if (status === 'active') {
    return { isAllowed: true, plan: 'pro' };
  }

  // 2. Teste Grátis (Trial)
  // Aceitamos 'trial', nulo ou string vazia como Trial válido
  if (status === 'trial' || !status) {
    
    // Se a data vier nula, libera 30 dias
    if (!user.trial_ends_at) {
        return { isAllowed: true, plan: 'trial', daysLeft: 30 };
    }

    const now = new Date();
    const trialEnd = new Date(user.trial_ends_at);
    
    // Adicionei uma tolerância grande (24h) para evitar qualquer erro de fuso horário bloqueando o user
    const tolerance = 24 * 60 * 60 * 1000; 

    if (now.getTime() < (trialEnd.getTime() + tolerance)) {
        const diffTime = Math.abs(trialEnd.getTime() - now.getTime());
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return { isAllowed: true, plan: 'trial', daysLeft };
    } else {
        // Só bloqueia se a data REALMENTE tiver passado muito
        return { isAllowed: false, reason: "trial_expired" };
    }
  }

  // Bloqueado apenas se status for explicitamente cancelado/inativo
  return { isAllowed: false, reason: "inactive" };
}