import { BarChart3, Box, Home, LayoutDashboard, Package, Settings, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 p-6 hidden md:block">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
          S
        </div>
        <span className="text-lg font-bold text-white">SaaS Admin</span>
      </div>

      {/* Menu Principal */}
      <nav className="space-y-1">
        <Link 
          href="/admin" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <Link 
          href="/admin/produtos" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <Package size={20} />
          <span>Produtos</span>
        </Link>

        <Link 
          href="/admin/pedidos" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <ShoppingCart size={20} />
          <span>Pedidos</span>
        </Link>

        <Link 
          href="/admin/clientes" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <Users size={20} />
          <span>Clientes</span>
        </Link>

        <div className="my-4 border-t border-zinc-800 pt-4 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Configurações
        </div>

        <Link 
          href="/admin/configuracoes" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <Settings size={20} />
          <span>Loja</span>
        </Link>
      </nav>
    </aside>
  );
}