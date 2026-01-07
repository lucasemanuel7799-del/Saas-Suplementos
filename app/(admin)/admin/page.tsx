"use client";

import { RevenueChart, TopProductsChart } from "@/components/admin/overview-charts";
import { RecentActivity } from "@/components/admin/recent-activity";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

// DADOS DE EXEMPLO
const MOCK_DATA = {
  dia: {
    sales: [ { name: "08h", vendas: 120 }, { name: "10h", vendas: 450 }, { name: "12h", vendas: 800 }, { name: "14h", vendas: 300 }, { name: "16h", vendas: 650 }, { name: "18h", vendas: 900 } ],
    products: [ { name: "Whey Growth", value: 12, color: '#2563eb' }, { name: "Creatina", value: 8, color: '#16a34a' } ],
    orders: 12,
  },
  semana: {
    sales: [ { name: "Seg", vendas: 1200 }, { name: "Ter", vendas: 2100 }, { name: "Qua", vendas: 800 }, { name: "Qui", vendas: 1600 }, { name: "Sex", vendas: 2400 }, { name: "Sáb", vendas: 3200 }, { name: "Dom", vendas: 1800 } ],
    products: [ { name: "Whey Growth", value: 120, color: '#2563eb' }, { name: "Creatina", value: 85, color: '#16a34a' }, { name: "Pré-Treino", value: 50, color: '#9333ea' }, { name: "Outros", value: 35, color: '#f97316' } ],
    orders: 84,
  },
  mes: {
    sales: [ { name: "Sem 1", vendas: 12000 }, { name: "Sem 2", vendas: 15400 }, { name: "Sem 3", vendas: 9800 }, { name: "Sem 4", vendas: 18200 } ],
    products: [ { name: "Whey Growth", value: 450, color: '#2563eb' }, { name: "Creatina", value: 320, color: '#16a34a' }, { name: "Pré-Treino", value: 210, color: '#9333ea' }, { name: "BCAA", value: 150, color: '#f97316' } ],
    orders: 340,
  },
  ano: {
    sales: [ { name: "Jan", vendas: 45000 }, { name: "Fev", vendas: 52000 }, { name: "Mar", vendas: 48000 }, { name: "Abr", vendas: 61000 }, { name: "Mai", vendas: 55000 }, { name: "Jun", vendas: 67000 } ],
    products: [ { name: "Whey Growth", value: 1200, color: '#2563eb' }, { name: "Creatina", value: 900, color: '#16a34a' }, { name: "Pré-Treino", value: 600, color: '#9333ea' }, { name: "Kit Mass", value: 400, color: '#f97316' } ],
    orders: 2100,
  }
};

function SlimCard({ title, value, subtext, icon: Icon, colorClass }: any) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 shadow-sm transition-all hover:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</span>
        <div className={`rounded-full bg-opacity-10 p-1.5 ${colorClass.bg} ${colorClass.text}`}>
            <Icon size={16} />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {subtext && <p className="text-[10px] text-zinc-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"dia" | "semana" | "mes" | "ano">("semana");
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    async function fetchRealStock() {
      const { data } = await supabase.from("products").select("stock");
      if (data) {
        const count = data.filter(p => (p.stock || 0) < 5).length;
        setLowStock(count);
      }
    }
    fetchRealStock();
  }, []);

  const currentData = MOCK_DATA[period];
  const totalRevenue = currentData.sales.reduce((acc, item) => acc + item.vendas, 0);
  const averageTicket = totalRevenue / currentData.orders;

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER + FILTRO GLOBAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 self-start md:self-auto">
            {["dia", "semana", "mes", "ano"].map((p) => (
                <button
                    key={p}
                    onClick={() => setPeriod(p as any)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                        period === p 
                        ? "bg-zinc-800 text-white shadow-sm border border-zinc-700" 
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    {p}
                </button>
            ))}
        </div>
      </div>

      {/* 1. CARDS SLIM */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlimCard title="Receita" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)} subtext="No período" icon={DollarSign} colorClass={{ bg: 'bg-green-500/20', text: 'text-green-500' }} />
        <SlimCard title="Ticket Médio" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)} subtext="Média vendas" icon={TrendingUp} colorClass={{ bg: 'bg-blue-500/20', text: 'text-blue-500' }} />
        <SlimCard title="Pedidos" value={currentData.orders} subtext="Total vendas" icon={ShoppingBag} colorClass={{ bg: 'bg-purple-500/20', text: 'text-purple-500' }} />
        <SlimCard title="Estoque Baixo" value={lowStock} subtext="Requer atenção" icon={AlertTriangle} colorClass={{ bg: 'bg-orange-500/20', text: 'text-orange-500' }} />
      </div>

      {/* 2. GRID PRINCIPAL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LINHA DE CIMA */}
        
        {/* Gráfico de Receita (2 Colunas) */}
        <div className="lg:col-span-2 h-[400px]">
            <RevenueChart data={currentData.sales} />
        </div>

        {/* Gráfico de Pizza (1 Coluna) */}
        <div className="lg:col-span-1 h-[400px]">
            <TopProductsChart data={currentData.products} />
        </div>


        {/* LINHA DE BAIXO */}

        {/* Atividades Recentes (1 Coluna - Esquerda) */}
        <div className="lg:col-span-1 h-[400px]">
            <RecentActivity />
        </div>

        {/* Card Vazio / Futuro (2 Colunas - Direita) */}
        <div className="lg:col-span-2 h-[400px] rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-zinc-800 p-4 mb-4">
                <Package size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-sm font-medium text-zinc-300">Espaço Reservado</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[300px]">
                Futuramente, podemos colocar aqui uma tabela de Metas Mensais, Lista de Melhores Clientes ou um Calendário de Envios.
            </p>
        </div>

      </div>
    </div>
  );
}