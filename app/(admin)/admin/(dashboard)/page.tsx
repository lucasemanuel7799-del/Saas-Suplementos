"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  RevenueChart, 
  TopProductsChart 
} from "@/components/admin/overview-charts";
import { RecentActivity } from "@/components/admin/recent-activity";
import { 
  AlertTriangle, 
  DollarSign, 
  Package, 
  ShoppingBag, 
  TrendingUp,
  Loader2
} from "lucide-react";

// Componente SlimCard (Interno)
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
  const supabase = createClient();
  const [period, setPeriod] = useState<"dia" | "semana" | "mes" | "ano">("semana");
  const [loading, setLoading] = useState(true);

  // Estados de Dados
  const [stats, setStats] = useState({ revenue: 0, orders: 0, ticket: 0 });
  const [lowStock, setLowStock] = useState(0);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [productsChartData, setProductsChartData] = useState<any[]>([]);

  // Cores fixas para o gráfico
  const PIE_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#f97316', '#eab308', '#ef4444'];

  const loadDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'dia': startDate.setHours(0, 0, 0, 0); break;
        case 'semana': startDate.setDate(now.getDate() - 7); break;
        case 'mes': startDate.setDate(now.getDate() - 30); break;
        case 'ano': startDate.setMonth(now.getMonth() - 11); break;
      }

      const isoDate = startDate.toISOString();

      // 1. Pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, created_at, status')
        .gte('created_at', isoDate)
        .in('status', ['paid', 'processing', 'shipped', 'delivered']);

      if (ordersError) throw ordersError;

      // 2. Itens dos Pedidos (Para produtos top)
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity')
        .in('order_id', orders.map(o => o.id));

      if (itemsError) throw itemsError;

      // 3. Estoque Baixo
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .lt('stock', 5);

      setLowStock(lowStockCount || 0);

      // --- CÁLCULOS ---
      const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total), 0);
      const totalOrders = orders.length;
      const ticket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({ revenue: totalRevenue, orders: totalOrders, ticket });

      // Preparar Dados do Gráfico de Vendas
      const chartMap = new Map();
      
      // Inicialização das chaves do gráfico para não ficar vazio
      if (period === 'dia') {
        for (let i = 0; i < 24; i += 2) chartMap.set(`${i}h`.padStart(3, '0'), 0);
      } else if (period === 'semana') {
        ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(d => chartMap.set(d, 0));
      } else if (period === 'mes') {
        ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].forEach(s => chartMap.set(s, 0));
      } else if (period === 'ano') {
        ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].forEach(m => chartMap.set(m, 0));
      }

      orders.forEach(order => {
        const d = new Date(order.created_at);
        let key = '';
        if (period === 'dia') {
           const h = d.getHours();
           key = `${h % 2 === 0 ? h : h - 1}h`.padStart(3, '0');
        } else if (period === 'semana') key = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
        else if (period === 'mes') {
           const day = d.getDate();
           key = day <= 7 ? 'Sem 1' : day <= 14 ? 'Sem 2' : day <= 21 ? 'Sem 3' : 'Sem 4';
        } else if (period === 'ano') key = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][d.getMonth()];
        
        chartMap.set(key, (chartMap.get(key) || 0) + Number(order.total));
      });

      setSalesChartData(Array.from(chartMap, ([name, vendas]) => ({ name, vendas })));

      // Preparar Dados de Produtos
      const prodMap = new Map();
      orderItems?.forEach((item: any) => {
        prodMap.set(item.product_name, (prodMap.get(item.product_name) || 0) + item.quantity);
      });

      const processedProds = Array.from(prodMap, ([name, value]) => ({ name, value }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 5)
        .map((item, index) => ({ ...item, color: PIE_COLORS[index % PIE_COLORS.length] }));

      setProductsChartData(processedProds);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, period]);

  useEffect(() => {
    loadDashboardData();
    
    // Realtime Listener
    const channel = supabase.channel('realtime-dashboard-main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadDashboardData, supabase]);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400 text-sm">Visão geral em tempo real.</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 self-start md:self-auto">
            {["dia", "semana", "mes", "ano"].map((p) => (
                <button
                    key={p}
                    onClick={() => { setLoading(true); setPeriod(p as any); }}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${period === p ? "bg-zinc-800 text-white shadow-sm border border-zinc-700" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    {p}
                </button>
            ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlimCard title="Receita" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)} subtext="No período" icon={DollarSign} colorClass={{ bg: 'bg-green-500/20', text: 'text-green-500' }} />
        <SlimCard title="Ticket Médio" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.ticket)} subtext="Média vendas" icon={TrendingUp} colorClass={{ bg: 'bg-blue-500/20', text: 'text-blue-500' }} />
        <SlimCard title="Pedidos" value={stats.orders} subtext="Total confirmados" icon={ShoppingBag} colorClass={{ bg: 'bg-purple-500/20', text: 'text-purple-500' }} />
        <SlimCard title="Estoque Baixo" value={lowStock} subtext="Requer atenção" icon={AlertTriangle} colorClass={{ bg: 'bg-orange-500/20', text: 'text-orange-500' }} />
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[400px]">
            <RevenueChart data={salesChartData} />
        </div>
        <div className="lg:col-span-1 h-[400px]">
             {productsChartData.length > 0 ? <TopProductsChart data={productsChartData} /> : 
             <div className="h-full w-full flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900 rounded-xl p-6 text-center text-zinc-500"><Package size={32} className="mb-2 opacity-50"/>Sem dados.</div>}
        </div>
        <div className="lg:col-span-1 h-[400px]">
            <RecentActivity />
        </div>
        <div className="lg:col-span-2 h-[400px] rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-zinc-800 p-4 mb-4"><Package size={24} className="text-zinc-500" /></div>
            <h3 className="text-sm font-medium text-zinc-300">Espaço Reservado</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[300px]">Futuramente: Tabela de Metas Mensais ou Lista de Melhores Clientes.</p>
        </div>
      </div>
    </div>
  );
}