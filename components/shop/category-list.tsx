"use client";

import { useCart } from "@/contexts/cart-context";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface CategoryListProps {
  categories: string[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    // REMOVIDO: "sticky top-[...]" 
    // AGORA: É um bloco normal que vai sumir quando rolar a tela
    <div className="w-full border-b border-zinc-800 bg-black/95 py-3">
      <div className="flex w-full gap-2 overflow-x-auto px-4 scrollbar-hide">
        
        {/* Botão TODOS */}
        <Link
          href="/"
          className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
            !currentCategory
              ? "bg-white border-white text-black"
              : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          }`}
        >
          Todos
        </Link>

        {/* Categorias */}
        {categories.map((category) => (
          <Link
            key={category}
            href={`/?category=${encodeURIComponent(category)}`}
            className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              currentCategory === category
                ? "bg-white border-white text-black"
                : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}