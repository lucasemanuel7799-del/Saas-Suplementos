"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  DollarSign, ShoppingBag, Package, Wallet, 
  TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, ExternalLink, ArrowRight 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  // Dados
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [kpi, setKpi] = useState({
    revenue: 0,
    prevRevenue: 0,
    profit: 0,
    ordersCount: 0,
    averageTicket: 0,
    lowStock: 0,
    pendingOrders: 0,
    paidOrders: 0
  });

  const getDates = () => {
    const now = new Date();
    const start = new Date(now);
    const prevStart = new Date(now);
    
    start.setHours(0,0,0,0);
    prevStart.setHours(0,0,0,0);

    switch (timeRange) {
        case 'today':
            prevStart.setDate(prevStart.getDate() - 1);
            break;
        case 'week':
            start.setDate(start.getDate() - 7);
            prevStart.setDate(prevStart.getDate() - 14);
            break;
        case 'month':
            start.setDate(start.getDate() - 30);
            prevStart.setDate(prevStart.getDate() - 60);
            break;
        case 'year':
            start.setFullYear(start.getFullYear() - 1);
            prevStart.setFullYear(prevStart.getFullYear() - 2);
            break;
    }
    return { start, prevStart };
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // --- PASSO CRUCIAL: PEGAR O ID DA LOJA ---
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!store) {
        setLoading(false);
        return;
      }

      const { start, prevStart } = getDates();

      // --- 1. BUSCA PEDIDOS ATUAIS DA LOJA ---
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store.id) // CORRIGIDO
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false });

      // --- 2. BUSCA PEDIDOS ANTERIORES DA LOJA ---
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("store_id", store.id) // CORRIGIDO
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", start.toISOString());

      if (orders) {
        setRecentOrders(orders.slice(0, 20));
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
        const prevRevenueTotal = prevOrders?.reduce((acc, o) => acc + (o.total_amount || 0), 0) || 0;

        setKpi(prev => ({ 
            ...prev, 
            ordersCount: totalOrders,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            paidOrders: orders.filter(o => o.status === 'paid').length,
            revenue: totalRevenue, 
            prevRevenue: prevRevenueTotal,
            averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0
        }));
      }

      // --- 3. DADOS DO GRÁFICO ---
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("store_id", store.id) // CORRIGIDO
        .eq("type", "income")
        .gte("due_date", start.toISOString());

      if (transactions) {
        const chartMap = transactions.reduce((acc: any, t) => {
            let key;
            if (timeRange === 'today') {
                key = new Date(t.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } else {
                key = new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }
            acc[key] = (acc[key] || 0) + Number(t.amount);
            return acc;
        }, {});
        
        let chartArray = Object.entries(chartMap).map(([date, value]) => ({ date, value }));
        
        if (timeRange !== 'today') {
            chartArray.sort((a: any, b: any) => {
                const [d1, m1] = a.date.split('/');
                const [d2, m2] = b.date.split('/');
                return new Date(2026, m1-1, d1).getTime() - new Date(2026, m2-1, d2).getTime();
            });
        }
        setSalesData(chartArray);
      }

      // --- 4. TOP PRODUTOS E LUCRO ---
      if (orders && orders.length > 0) {
          const orderIds = orders.map(o => o.id);
          const { data: items } = await supabase
            .from("order_items")
            .select(`quantity, products (name, price, cost_price)`)
            .in("order_id", orderIds);

          if (items) {
            let totalProfit = 0;
            const productMap = items.reduce((acc: any, item: any) => {
                const name = item.products?.name || "Outros";
                const qtd = item.quantity;
                const cost = item.products?.cost_price || 0;
                const price = item.products?.price || 0;
                
                totalProfit += (price - cost) * qtd;
                acc[name] = (acc[name] || 0) + qtd;
                return acc;
            }, {});
            
            setKpi(prev => ({ ...prev, profit: totalProfit }));

            const topArray = Object.entries(productMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a: any, b: any) => (b.value as number) - (a.value as number))
                .slice(0, 5);
            setTopProducts(topArray);
          }
      } else {
          setTopProducts([]);
          setKpi(prev => ({ ...prev, profit: 0 }));
      }

      // --- 5. ESTOQUE BAIXO ---
      const { data: prodStock } = await supabase.from("products").select("stock").eq("store_id", store.id); // CORRIGIDO
      if(prodStock) {
        setKpi(prev => ({ ...prev, lowStock: prodStock.filter(p => p.stock <= 5).length }));
      }

      setLoading(false);
    }

    fetchData();
  }, [timeRange]);

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getGrowth = () => {
    if (kpi.prevRevenue === 0) return 100;
    return ((kpi.revenue - kpi.prevRevenue) / kpi.prevRevenue) * 100;
  };
  const growth = getGrowth();

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-zinc-800 p-1">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Visão geral • 
                    <span className="text-emerald-500 font-bold ml-1">
                        {timeRange === 'today' && 'Hoje'}
                        {timeRange === 'week' && 'Últimos 7 dias'}
                        {timeRange === 'month' && 'Últimos 30 dias'}
                        {timeRange === 'year' && 'Último ano'}
                    </span>
                </p>
            </div>

            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start xl:self-auto">
                {[{ key: 'today', label: 'Dia' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mês' }, { key: 'year', label: 'Ano' }].map((filter) => (
                    <button key={filter.key} onClick={() => setTimeRange(filter.key)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === filter.key ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>{filter.label}</button>
                ))}
            </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Faturamento</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : `R$ ${kpi.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</h3>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><DollarSign size={20}/></div>
                </div>
                <div className={`flex items-center gap-1 text-xs z-10 font-medium ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {growth >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} 
                    {loading ? "..." : `${Math.abs(growth).toFixed(1)}%`}
                    <span className="text-zinc-500 font-normal ml-1">vs anterior</span>
                </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Lucro Estimado</p>
                        <h3 className="text-2xl font-bold text-blue-400 mt-1">{loading ? "..." : `R$ ${kpi.profit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}</h3>
                    </div>
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Wallet size={20}/></div>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400 z-10 font-medium">
                   Ticket Médio: <span className="text-zinc-300">R$ {kpi.averageTicket.toFixed(2)}</span>
                </div>
            </div>

            <div onClick={() => router.push('/admin/pedidos')} className="cursor-pointer p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between h-32 hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">Vendas <ExternalLink size={10}/></p>
                        <h3 className="text-2xl font-bold text-white mt-1">{loading ? "..." : kpi.ordersCount}</h3>
                    </div>
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><ShoppingBag size={20}/></div>
                </div>
                <div className="flex gap-3 text-xs z-10 mt-1">
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{kpi.paidOrders} Pagos</span>
                    <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">{kpi.pendingOrders} Pen</span>
                </div>
            </div>

            <div onClick={() => router.push('/admin/produtos')} className="cursor-pointer p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between h-32 hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">Estoque Baixo <ExternalLink size={10}/></p>
                        <h3 className={`text-2xl font-bold mt-1 ${kpi.lowStock > 0 ? 'text-orange-500' : 'text-white'}`}>
                            {loading ? "..." : kpi.lowStock}
                        </h3>
                    </div>
                    <div className={`p-2 rounded-lg ${kpi.lowStock > 0 ? 'bg-orange-500/10 text-orange-500 animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                        <AlertCircle size={20}/>
                    </div>
                </div>
                <div className="text-xs text-zinc-500 z-10">Abaixo de 5 unidades</div>
            </div>
        </div>

        {/* GRAFICOS E LISTAS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[320px]">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="text-sm font-bold text-zinc-200">Pedidos Recentes</h3>
                    <Link href="/admin/pedidos" className="text-xs text-emerald-500 hover:underline">Ver tudo</Link>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {loading ? (
                         <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-bold animate-pulse">Carregando...</div>
                    ) : recentOrders.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">Sem vendas no período.</div>
                    ) : (
                        recentOrders.map((order) => (
                            <div key={order.id} className="p-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">#{order.id.toString().slice(0,4)}</span>
                                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                            {order.status === 'paid' ? 'Pago' : 'Pen'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-emerald-400">R$ {Number(order.total_amount || 0).toFixed(2)}</p>
                                    <ArrowRight size={12} className="ml-auto text-zinc-600 group-hover:text-white transition-colors"/>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="xl:col-span-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 h-[320px] flex flex-col">
                <h3 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500"/> Performance Financeira
                </h3>
                <div className="flex-1 w-full min-h-0">
                    {salesData.length === 0 && !loading ? (
                        <div className="h-full flex items-center justify-center text-zinc-600 text-xs">Sem transações para exibir.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="xl:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 h-[320px] flex flex-col">
                <h3 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                    <Package size={16} className="text-orange-500"/> Top Produtos
                </h3>
                <div className="flex-1 w-full min-h-0">
                    {topProducts.length === 0 && !loading ? (
                        <div className="flex h-full items-center justify-center text-zinc-500 text-xs">Aguardando vendas...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={topProducts} cx="50%" cy="40%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={100} 
                                    content={(props) => {
                                        const { payload } = props;
                                        return (
                                            <ul className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[100px] scrollbar-hide">
                                                {payload?.map((entry: any, index: number) => (
                                                    <li key={`item-${index}`} className="flex items-center justify-between text-[10px] text-zinc-400">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="truncate max-w-[90px]">{entry.value}</span>
                                                        </div>
                                                        <span className="font-bold text-white">{(topProducts[index]?.value || 0)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}