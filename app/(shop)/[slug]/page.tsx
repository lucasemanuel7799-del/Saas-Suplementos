import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StoreFront from "@/components/shop/StoreFront";
import StoreLogin from "@/components/shop/StoreLogin";

// Função auxiliar para calcular se está aberto
function checkStoreOpen(opensAt: string | null, closesAt: string | null) {
  if (!opensAt || !closesAt) return true; // Se não configurou, assume aberto

  const now = new Date();
  const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  
  const currentMinutes = brTime.getHours() * 60 + brTime.getMinutes();

  const [openHour, openMinute] = opensAt.split(':').map(Number);
  const [closeHour, closeMinute] = closesAt.split(':').map(Number);

  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;

  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// CORREÇÃO AQUI: params agora é uma Promise
export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  
  // 1. DESEMBRULHAR OS PARAMS (Obrigatório no Next.js 15)
  const { slug } = await params;

  const supabase = await createClient();

  // 2. Busca a Loja (Usando a variável 'slug' que pegamos acima)
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug) 
    .single();

  if (!store) return notFound();

  // 3. Verifica Usuário
  const { data: { session } } = await supabase.auth.getSession();

  // --- MODO: LOGIN ---
  if (!session) {
    return <StoreLogin store={store as any} />;
  }

  // --- MODO: VITRINE ---
  const isOpen = checkStoreOpen(store.opens_at, store.closes_at);

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("active", true);

  return (
    <StoreFront 
      store={store as any} 
      products={(products || []) as any} 
      isOpen={isOpen} 
    />
  );
}