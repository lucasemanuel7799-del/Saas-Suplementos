"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  LayoutDashboard, 
  ShoppingCart, // Pedidos
  Package,      // Produtos
  Users,        // Clientes
  Box,          // Estoque
  DollarSign,   // Financeiro
  Settings, 
  LogOut,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const menuItems = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/admin" },
    { icon: ShoppingCart, label: "Pedidos", href: "/admin/pedidos" },
    { icon: Package, label: "Produtos", href: "/admin/produtos" },
    { icon: Users, label: "Clientes", href: "/admin/clientes" },
    { icon: Box, label: "Estoque", href: "/admin/inventory" },
    { icon: DollarSign, label: "Financeiro", href: "/admin/financeiro" },
    { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/admin/login");
  }

  return (
    <div className="flex h-full flex-col justify-between bg-zinc-900 p-4 text-zinc-100 border-r border-zinc-800">
      
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-bold">
            S
          </div>
          <span className="text-lg font-bold">SupleSaaS</span>
        </div>

        {/* Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            // Verifica se a rota atual começa com o href do item (para manter ativo em subpáginas)
            // Ex: /admin/produtos/novo manterá "Produtos" ativo
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-600/10 text-blue-500" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Botão Sair */}
      <div className="border-t border-zinc-800 pt-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}