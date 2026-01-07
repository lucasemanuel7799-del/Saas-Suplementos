"use client";

import { PackagePlus, ShoppingCart, User } from "lucide-react";

const activities = [
  { id: 1, type: "order", message: "Novo pedido #1234 de R$ 249,90", time: "há 2 min", user: "Carlos Silva" },
  { id: 2, type: "product", message: "Estoque de 'Whey' atualizado", time: "há 15 min", user: "Você" },
  { id: 3, type: "order", message: "Pedido #1235 realizado", time: "há 45 min", user: "Ana Julia" },
  { id: 4, type: "user", message: "Novo cliente cadastrado", time: "há 3 horas", user: "Marcos V." },
  { id: 5, type: "product", message: "Preço de 'Creatina' alterado", time: "há 5 horas", user: "Você" },
  { id: 6, type: "order", message: "Pedido #1230 enviado", time: "há 1 dia", user: "Sistema" },
  { id: 7, type: "user", message: "Cliente atualizou o perfil", time: "há 1 dia", user: "Juliana M." },
];

export function RecentActivity() {
  return (
    <div className="flex flex-col h-[400px] rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Atividades Recentes</h3>
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">Hoje</span>
      </div>

      {/* Lista com Scroll */}
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="divide-y divide-zinc-800">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-zinc-800/50 transition-colors">
              
              {/* Ícone */}
              <div className="mt-0.5">
                {item.type === "order" && <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><ShoppingCart size={14} /></div>}
                {item.type === "product" && <div className="p-2 rounded-full bg-orange-500/10 text-orange-500"><PackagePlus size={14} /></div>}
                {item.type === "user" && <div className="p-2 rounded-full bg-green-500/10 text-green-500"><User size={14} /></div>}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium text-zinc-300">{item.message}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">{item.user}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}