"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils"; // Certifique-se de ter essa func utilitária ou remova o cn e use string template simples

export function CategoryNav({ categories }: { categories: string[] }) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    <div className="sticky top-[72px] z-10 border-b border-zinc-800 bg-black/95 py-3 backdrop-blur-sm">
      <div className="flex w-full gap-2 overflow-x-auto px-4 scrollbar-hide">
        
        {/* Botão TODOS */}
        <Link
          href="/"
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !currentCategory
              ? "bg-white text-black"
              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          Todos
        </Link>

        {/* Botões Dinâmicos */}
        {categories.map((category) => (
          <Link
            key={category}
            href={`/?category=${encodeURIComponent(category)}`}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              currentCategory === category
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {category}
          </Link>
        ))}
      </div>
    </div>
  );
}