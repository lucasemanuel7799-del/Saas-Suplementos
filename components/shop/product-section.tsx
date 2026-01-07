import { ProductCard } from "./product-card";

// Mock de dados (apenas para exemplo, se estiver usando)
const products = [
  {
    id: 1,
    name: "Whey Protein Concentrado",
    price: 99.9,
    image_url: null,
    category: "Proteínas",
  },
  {
    id: 2,
    name: "Creatina Monohidratada",
    price: 49.9,
    image_url: null,
    category: "Aminoácidos",
  },
  {
    id: 3,
    name: "Pré-Treino Haze",
    price: 89.9,
    image_url: null,
    category: "Energia",
  },
  {
    id: 4,
    name: "Multivitamínico",
    price: 39.9,
    image_url: null,
    category: "Saúde",
  },
];

export function ProductSection() {
  return (
    <section className="py-6">
      <h2 className="mb-4 text-lg font-bold text-white px-4">Destaques</h2>
      
      <div className="flex w-full gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="min-w-[160px] max-w-[160px]">
            {/* CORREÇÃO AQUI: Passamos o objeto inteiro dentro da prop 'product' */}
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}