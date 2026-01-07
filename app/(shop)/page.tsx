import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryList } from "@/components/shop/category-list";

export const revalidate = 0;

interface ShopHomeProps {
  searchParams: {
    category?: string;
  };
}

export default async function ShopHome({ searchParams }: ShopHomeProps) {
  const selectedCategory = searchParams?.category;

  // 1. Busca TUDO do banco
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !products) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar loja.</div>;
  }

  // 2. Extrai categorias para a Navbar
  const allCategories = Array.from(
    new Set(products.map((p) => p.category).filter((c) => c && c !== ""))
  ) as string[];

  // 3. Define quais categorias vamos mostrar na tela
  // Se clicou no filtro, mostra só aquela. Se não, mostra todas em lista.
  const categoriesToDisplay = selectedCategory ? [selectedCategory] : allCategories;

  return (
    <div className="min-h-screen bg-black pb-24">
      
      {/* Navbar de Categorias (Agora rola junto com a tela) */}
      <div className="mx-auto max-w-6xl">
        <CategoryList categories={allCategories} />
      </div>

      <div className="mx-auto max-w-6xl">
        
        {/* LOOP DE CATEGORIAS (Adeus "Destaques") */}
        <div className="flex flex-col gap-10 py-6">
          {categoriesToDisplay.map((categoryName) => {
            
            // Pega só os produtos dessa categoria
            const categoryProducts = products.filter((p) => p.category === categoryName);

            // Se não tiver produto, não exibe a seção
            if (categoryProducts.length === 0) return null;

            return (
              <section key={categoryName} className="px-4">
                
                {/* Título da Categoria */}
                <div className="mb-4 flex items-center justify-between border-l-4 border-blue-600 pl-3">
                  <h3 className="text-xl font-bold text-white capitalize md:text-2xl">
                    {categoryName}
                  </h3>
                  <span className="text-xs font-medium text-zinc-500">
                    {categoryProducts.length} itens
                  </span>
                </div>

                {/* Grid Responsivo (2 no cel, 3 tablet, 4 pc) */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {categoryProducts.map((product) => (
                    <div key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Estado Vazio */}
          {categoriesToDisplay.length === 0 && (
             <div className="mt-20 text-center text-zinc-500">
               <p>Nenhum produto cadastrado ainda.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}