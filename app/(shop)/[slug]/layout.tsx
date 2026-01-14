import { getStoreBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { ShopWrapper } from "@/components/shop/shop-wrapper"; // Importe o Wrapper novo

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return notFound();
  }

  // O Layout Server apenas entrega os dados para o Wrapper Client
  return (
    <ShopWrapper store={store}>
      {children}
    </ShopWrapper>
  );
}