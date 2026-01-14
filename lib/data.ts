import { createClient } from "@/lib/supabase-server";

export async function getStoreBySlug(slug: string) {
  try {
    // 1. Cria o cliente (com await, pois é assíncrono agora)
    const supabase = await createClient();

    // 2. Busca a loja
    const { data: store, error } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .maybeSingle(); // maybeSingle é mais seguro que single

    if (error) {
      console.error("❌ Erro do Supabase ao buscar loja:", error.message);
      return null;
    }

    return store;

  } catch (err) {
    console.error("❌ Erro Crítico no getStoreBySlug:", err);
    return null;
  }
}