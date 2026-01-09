import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import StoreFront from "@/components/shop/StoreFront"; // Importe o componente novo

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function checkIsOpen(opensAt: string | null, closesAt: string | null) {
  if (!opensAt || !closesAt) return true;
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const currentMinutes = brazilTime.getHours() * 60 + brazilTime.getMinutes();
  const [oh, om] = opensAt.split(':').map(Number);
  const [ch, cm] = closesAt.split(':').map(Number);
  return currentMinutes >= (oh * 60 + om) && currentMinutes < (ch * 60 + cm);
}

export default async function ShopPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. Busca Loja
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!store) return notFound();

  // 2. Calcula Status
  const isOpen = checkIsOpen(store.opens_at, store.closes_at);

  // 3. Busca Produtos (INCLUINDO A COLUNA CATEGORY)
  let products: any[] = [];
  const { data: p } = await supabase
    .from("products")
    .select("id, name, price, stock, image_url, category") // <--- Importante pedir a category aqui
    .eq("store_id", store.id)
    .gt("stock", 0)
    .order("name", { ascending: true });
  
  if (p) products = p;

  // 4. Renderiza o Componente Cliente
  return (
    <StoreFront 
      store={store} 
      products={products} 
      isOpen={isOpen} 
    />
  );
}