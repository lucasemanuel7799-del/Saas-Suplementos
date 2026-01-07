import { ProductCard } from "./product-card";

interface ProductRowProps {
  title: string;
}

export function ProductRow({ title }: ProductRowProps) {
  return (
    <section className="space-y-3 py-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-xs font-medium text-blue-400 cursor-pointer">Ver tudo</span>
      </div>

      <div className="flex w-full gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProductCard 
            key={i} 
            id={i} // <--- O erro sumiu porque adicionamos o ID aqui
            name={`Suplemento Top ${i}`} 
            price={99.90 + i * 10} 
            category={title}
          />
        ))}
      </div>
    </section>
  );
}