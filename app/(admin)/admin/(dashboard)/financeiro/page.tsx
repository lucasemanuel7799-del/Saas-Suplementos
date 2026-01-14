"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Filter, CheckCircle2, AlertCircle, X, Loader2,
  PieChart as PieIcon, BarChart3, Download, Search
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from "recharts";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_type: "fixed" | "variable";
  category: string;
  status: "paid" | "pending";
  due_date: string;
  payment_date?: string | null;
}

export default function FinancePage() {
  const supabase = createClient();
  
  // --- ESTADOS ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
      description: "",
      amount: "",
      type: "expense" as "income" | "expense",
      category_type: "variable" as "fixed" | "variable",
      category: "Outros",
      status: "paid" as "paid" | "pending",
      due_date: new Date().toISOString().split('T')[0]
  });

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca o ID da Loja (UUID)
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (store) {
        setStoreId(store.id);

        // 2. Busca Transações daquela Loja Específica
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("store_id", store.id) // CORRIGIDO
          .gte("due_date", dateRange.start)
          .lte("due_date", dateRange.end)
          .order("due_date", { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      }
    } catch (error) {
      console.error("Erro financeiro:", error);
      toast.error("Erro ao carregar movimentações.");
    } finally {
      setLoading(false);
    }
  }

  // --- KPI CÁLCULOS ---
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const val = Number(t.amount);
      if (t.type === 'income') {
          acc.totalIncome += val;
          if (t.status === 'pending') acc.pendingReceive += val;
      } else {
          acc.totalExpense += val;
          if (t.status === 'pending') acc.pendingPay += val;
      }
      if (t.status === 'paid') {
          if (t.type === 'income') acc.balance += val;
          else acc.balance -= val;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, balance: 0, pendingPay: 0, pendingReceive: 0 });
  }, [transactions]);

  // --- GRÁFICOS ---
  const chartData = useMemo(() => {
    const grouped = transactions.reduce((acc: any, t) => {
      const date = new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) acc[date] = { name: date, income: 0, expense: 0 };
      if (t.type === 'income') acc[date].income += Number(t.amount);
      else acc[date].expense += Number(t.amount);
      return acc;
    }, {});
    return Object.values(grouped).reverse();
  }, [transactions]);

  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc: any, t) => {
      const cat = t.category || 'Outros';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(t.amount);
      return acc;
    }, {});
    const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
    return Object.entries(grouped).map(([name, value], index) => ({
      name, value, color: COLORS[index % COLORS.length]
    }));
  }, [transactions]);

  // --- AÇÕES ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Loja não identificada.");
    
    setIsSaving(true);
    try {
        const finalCategory = formData.category || (formData.type === 'income' ? 'Vendas' : 'Outros');

        const { error } = await supabase.from("transactions").insert({
            store_id: storeId, // UUID CORRIGIDO
            description: formData.description,
            amount: parseFloat(formData.amount.toString().replace(",", ".")),
            type: formData.type,
            category_type: formData.category_type,
            category: finalCategory,
            status: formData.status,
            due_date: formData.due_date,
            payment_date: formData.status === 'paid' ? new Date() : null
        });

        if (error) throw error;
        toast.success("Lançamento registrado!");
        
        setIsModalOpen(false);
        setFormData({ 
            description: "", amount: "", type: "expense", category_type: "variable", 
            category: "Outros", status: "paid", due_date: new Date().toISOString().split('T')[0] 
        });
        fetchTransactions();
    } catch (e: any) {
        toast.error(`Erro: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    try {
        await supabase.from("transactions").delete().eq("id", id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success("Excluído.");
    } catch (e) {
        toast.error("Erro ao excluir.");
    }
  };

  const markAsPaid = async (t: Transaction) => {
    const newStatus = t.status === 'paid' ? 'pending' : 'paid';
    setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, status: newStatus } : item));
    try {
        await supabase.from("transactions").update({ 
            status: newStatus,
            payment_date: newStatus === 'paid' ? new Date() : null 
        }).eq("id", t.id);
        toast.success(newStatus === 'paid' ? 'Pago' : 'Pendente');
    } catch (e) {
        fetchTransactions();
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return toast.error("Sem dados");
    const headers = ["Data,Descrição,Categoria,Tipo,Valor,Status"];
    const rows = transactions.map(t => `${new Date(t.due_date).toLocaleDateString('pt-BR')},"${t.description}",${t.category},${t.type},${t.amount},${t.status}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `financeiro.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pb-20 scrollbar-hide p-1">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
            <p className="text-zinc-400 text-sm mt-1">Gestão de fluxo de caixa e DRE.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-transparent text-white text-xs p-1 outline-none w-28" />
                <div className="h-4 w-px bg-zinc-800"></div>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-transparent text-white text-xs p-1 outline-none w-28" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={exportToCSV} className="p-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all"><Download size={18}/></button>
                <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95"><Plus size={18} /> Novo</button>
            </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Saldo Real</span>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-white' : 'text-red-500'}`}>R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">A Pagar</span>
            <p className="text-2xl font-bold text-red-400">R$ {summary.pendingPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Receita</span>
            <p className="text-2xl font-bold text-blue-400">R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Despesa</span>
            <p className="text-2xl font-bold text-orange-400">R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-80 flex flex-col">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BarChart3 size={14} className="text-emerald-500"/> Fluxo Diário</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 h-80 flex flex-col">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PieIcon size={14} className="text-orange-500"/> Categorias</h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                            {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* TABELA */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col flex-1">
         <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between bg-zinc-900/50">
            <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input type="text" placeholder="Buscar lançamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none" />
            </div>
            <div className="flex gap-2">
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-bold text-zinc-400 outline-none uppercase">
                    <option value="all">Todos Tipos</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-bold text-zinc-400 outline-none uppercase">
                    <option value="all">Todos Status</option>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                </select>
            </div>
         </div>

         <div className="overflow-auto scrollbar-thin scrollbar-thumb-zinc-800">
             <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-950 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-b border-zinc-800">
                     <tr>
                         <th className="px-6 py-4">Descrição</th>
                         <th className="px-6 py-4">Categoria</th>
                         <th className="px-6 py-4 text-center">Data</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right"></th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline text-zinc-700"/></td></tr>
                    ) : filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-800/30 group">
                            <td className="px-6 py-4 font-bold text-white uppercase text-xs">{t.description}</td>
                            <td className="px-6 py-4 text-zinc-500 text-xs uppercase font-medium">{t.category}</td>
                            <td className="px-6 py-4 text-center text-zinc-400 font-mono text-xs">{new Date(t.due_date).toLocaleDateString('pt-BR')}</td>
                            <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {t.type === 'expense' && "- "}R$ {Number(t.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => markAsPaid(t)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-all ${t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                   {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => deleteTransaction(t.id)} className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><X size={14} /></button>
                            </td>
                        </tr>
                    ))}
                 </tbody>
             </table>
         </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center uppercase tracking-widest text-[10px] font-bold text-white">
                    Novo Lançamento <button onClick={() => setIsModalOpen(false)}><X size={16} /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                        <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 text-[10px] font-bold uppercase rounded-lg ${formData.type === 'income' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>Entrada</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 text-[10px] font-bold uppercase rounded-lg ${formData.type === 'expense' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>Saída</button>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Descrição</label>
                        <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-600 outline-none text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor (R$)</label>
                            <input required type="text" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white outline-none text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Data</label>
                            <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white outline-none text-sm" />
                        </div>
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} Salvar Registro
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}