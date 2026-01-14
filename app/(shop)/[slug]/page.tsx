import { createClient } from "@/lib/supabase-server"; 
import { notFound } from "next/navigation";

// --- CORREÇÃO AQUI: Importando do SEU arquivo StoreFront.tsx ---
import { StoreFront } from "@/components/shop/StoreFront"; 

// Função auxiliar de horário
function checkStoreOpen(opensAt: string, closesAt: string, openDays: number[]) {
  if (!opensAt || !closesAt) return false;
  
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utc - (3 * 3600000));
  
  const currentDay = brasiliaTime.getDay();
  const currentTime = brasiliaTime.getHours() * 60 + brasiliaTime.getMinutes();

  const [openH, openM] = opensAt.split(":").map(Number);
  const [closeH, closeM] = closesAt.split(":").map(Number);
  
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  if (!openDays.includes(currentDay)) return false;
  return currentTime >= openTime && currentTime < closeTime;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Busca Loja
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!store) return notFound();

  // 2. Busca Produtos
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("active", true)
    .order("category", { ascending: true });

  // 3. Verifica Status
  const isOpen = checkStoreOpen(
    store.opens_at || "08:00", 
    store.closes_at || "22:00", 
    store.open_days || [0,1,2,3,4,5,6]
  );

  // 4. Renderiza o SEU componente visual
  return (
    <StoreFront 
      store={store} 
      products={products || []} 
      isOpen={isOpen} 
    />
  );
}