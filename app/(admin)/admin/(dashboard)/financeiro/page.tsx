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

// Definição do Tipo para evitar erros de TypeScript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_type: "fixed" | "variable";
  category: string; // Nova coluna
  status: "paid" | "pending";
  due_date: string;
  payment_date?: string | null;
}

export default function FinancePage() {
  const supabase = createClient();
  
  // --- ESTADOS ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros Globais (Data)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1º dia do mês atual
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] // Último dia do mês atual
  });

  // Filtros de Visualização (Tabela)
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal e Loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulário
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]); // Recarrega sempre que muda a data

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("store_id", user?.id)
        .gte("due_date", dateRange.start) // Maior ou igual data inicio
        .lte("due_date", dateRange.end)   // Menor ou igual data fim
        .order("due_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  // --- CÁLCULOS DOS KPI (MEMOIZED) ---
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const val = Number(t.amount); // Garante que é número
      
      if (t.type === 'income') {
          acc.totalIncome += val;
          if (t.status === 'pending') acc.pendingReceive += val;
      } else {
          acc.totalExpense += val;
          if (t.status === 'pending') acc.pendingPay += val;
      }
      
      // Saldo Real (Considera apenas o que foi baixado como PAGO)
      if (t.status === 'paid') {
          if (t.type === 'income') acc.balance += val;
          else acc.balance -= val;
      }

      return acc;
    }, { totalIncome: 0, totalExpense: 0, balance: 0, pendingPay: 0, pendingReceive: 0 });
  }, [transactions]);

  // --- PREPARAÇÃO DE DADOS PARA GRÁFICOS ---
  
  // 1. Gráfico Diário (Timeline)
  const chartData = useMemo(() => {
    // Agrupa por dia
    const grouped = transactions.reduce((acc: any, t) => {
      const date = new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!acc[date]) acc[date] = { name: date, income: 0, expense: 0 };
      
      if (t.type === 'income') acc[date].income += Number(t.amount);
      else acc[date].expense += Number(t.amount);
      
      return acc;
    }, {});

    // Converte para array e ordena pela data (invertendo a ordem original que era desc)
    return Object.values(grouped).reverse();
  }, [transactions]);

  // 2. Gráfico de Pizza (Por Categoria Real)
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
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [transactions]);


  // --- FUNÇÕES DE AÇÃO ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Define categoria automaticamente se o usuário não escolheu
        const finalCategory = formData.category || (formData.type === 'income' ? 'Vendas' : 'Outros');

        const { error } = await supabase.from("transactions").insert({
            store_id: user?.id,
            description: formData.description,
            amount: parseFloat(formData.amount),
            type: formData.type,
            category_type: formData.category_type,
            category: finalCategory,
            status: formData.status,
            due_date: formData.due_date,
            payment_date: formData.status === 'paid' ? new Date() : null
        });

        if (error) throw error;
        toast.success("Lançamento salvo com sucesso!");
        
        // Reset form
        setFormData({ 
            description: "", amount: "", type: "expense", category_type: "variable", 
            category: "Outros", status: "paid", due_date: new Date().toISOString().split('T')[0] 
        });
        setIsModalOpen(false);
        fetchTransactions();
    } catch (e: any) {
        console.error(e);
        toast.error(`Erro ao salvar: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
        await supabase.from("transactions").delete().eq("id", id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success("Excluído com sucesso.");
    } catch (e) {
        toast.error("Erro ao excluir.");
    }
  };

  const markAsPaid = async (t: Transaction) => {
    const newStatus = t.status === 'paid' ? 'pending' : 'paid';
    // Otimistic UI Update
    setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, status: newStatus } : item));
    
    try {
        await supabase.from("transactions").update({ 
            status: newStatus,
            payment_date: newStatus === 'paid' ? new Date() : null 
        }).eq("id", t.id);
        toast.success(`Status alterado para ${newStatus === 'paid' ? 'Pago' : 'Pendente'}`);
    } catch (e) {
        toast.error("Erro ao atualizar status.");
        fetchTransactions(); // Reverte em caso de erro
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return toast.error("Sem dados para exportar");
    
    const headers = ["Data,Descrição,Categoria,Tipo,Valor,Status"];
    const rows = transactions.map(t => 
      `${new Date(t.due_date).toLocaleDateString('pt-BR')},"${t.description}",${t.category},${t.type === 'income' ? 'Entrada' : 'Saída'},${t.amount},${t.status}`
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financeiro_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem da Tabela (Local)
  const filteredTransactions = transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-zinc-800 p-2 md:p-0">
      
      {/* HEADER & FILTROS GLOBAIS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
            <p className="text-zinc-400 text-sm mt-1">Gestão inteligente do fluxo de caixa.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            {/* Seletor de Datas */}
            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 text-[10px] font-bold uppercase">De</span>
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-white text-sm pl-8 pr-2 py-1 outline-none w-32"
                    />
                </div>
                <div className="h-6 w-px bg-zinc-800"></div>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-500 text-[10px] font-bold uppercase">Até</span>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-white text-sm pl-9 pr-2 py-1 outline-none w-32"
                    />
                </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={exportToCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <Download size={18} /> <span className="hidden sm:inline">CSV</span>
                </button>
                <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
                    <Plus size={18} /> Novo
                </button>
            </div>
        </div>
      </div>

      {/* KPIS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
         {/* Saldo */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Saldo Real (Pago)</span>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><DollarSign size={18}/></div>
            </div>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-white' : 'text-red-500'}`}>
                R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
         </div>

         {/* Contas a Pagar */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">A Pagar (Pendente)</span>
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertCircle size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-red-400">
                R$ {summary.pendingPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
         </div>

         {/* Receita Total */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Receita (Período)</span>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><TrendingUp size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-blue-400">
                R$ {summary.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
         </div>

         {/* Despesa Total */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Despesa (Período)</span>
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><TrendingDown size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-orange-400">
                R$ {summary.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
         </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
         
         {/* Gráfico 1: Evolução Diária */}
         <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500"/> Fluxo de Caixa Diário
            </h3>
            <div className="h-72 w-full">
                {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                cursor={{fill: '#27272a'}}
                            />
                            <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                        Sem movimentações neste período
                    </div>
                )}
            </div>
         </div>

         {/* Gráfico 2: Despesas por Categoria */}
         <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <PieIcon size={16} className="text-orange-500"/> Onde estou gastando?
            </h3>
            <div className="h-72 w-full relative">
                {pieData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Sem despesas registradas</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
         </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
         
         {/* Toolbar da Tabela */}
         <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar descrição..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-zinc-700 outline-none"
                    />
                </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
                    <option value="all">Todos os Tipos</option>
                    <option value="income">Apenas Receitas</option>
                    <option value="expense">Apenas Despesas</option>
                </select>

                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
                    <option value="all">Todos Status</option>
                    <option value="paid">Pago / Recebido</option>
                    <option value="pending">Pendente</option>
                </select>
            </div>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs">
                     <tr>
                         <th className="px-6 py-4">Descrição</th>
                         <th className="px-6 py-4">Categoria</th>
                         <th className="px-6 py-4 text-center">Vencimento</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Ações</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-10 text-zinc-500"><Loader2 className="animate-spin inline mr-2"/> Carregando...</td></tr>
                    ) : filteredTransactions.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Nenhum lançamento encontrado neste período.</td></tr>
                    ) : (
                      filteredTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="font-bold text-white">{t.description}</div>
                                  <div className={`text-[10px] uppercase font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                      {t.type === 'income' ? 'Receita' : 'Despesa'}
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-zinc-400">
                                  {t.category}
                                  {t.type === 'expense' && (
                                    <span className="text-[10px] text-zinc-600 ml-2 border border-zinc-800 px-1 rounded">
                                        {t.category_type === 'fixed' ? 'FIXO' : 'VAR'}
                                    </span>
                                  )}
                              </td>
                              <td className="px-6 py-4 text-center text-zinc-400 font-mono text-xs">
                                  {new Date(t.due_date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {t.type === 'expense' && "- "}R$ {Number(t.amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <button onClick={() => markAsPaid(t)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'}`}>
                                     {t.status === 'paid' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                     {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                  </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => deleteTransaction(t.id)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2">
                                      <X size={16} />
                                  </button>
                              </td>
                          </tr>
                      ))
                    )}
                 </tbody>
             </table>
         </div>
      </div>

      {/* --- MODAL DE NOVO LANÇAMENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-white">Novo Lançamento</h2>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-zinc-500 hover:text-white" /></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    
                    {/* TIPO */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                        <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                            Entrada
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                            Saída
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                        <input required autoFocus value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Fornecedor MaxTitanium" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-600 outline-none transition-colors placeholder:text-zinc-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Valor (R$)</label>
                            <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-600 outline-none transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Vencimento</label>
                            <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-600 outline-none transition-colors" />
                        </div>
                    </div>

                    {/* CATEGORIAS DINÂMICAS */}
                    <div className="space-y-1">
                         <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                         <select 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-600 outline-none"
                         >
                            {formData.type === 'income' ? (
                                <>
                                    <option value="Vendas">Vendas de Produtos</option>
                                    <option value="Serviços">Serviços</option>
                                    <option value="Investimento">Aporte / Investimento</option>
                                    <option value="Outros">Outras Receitas</option>
                                </>
                            ) : (
                                <>
                                    <optgroup label="Operacional">
                                        <option value="Estoque">Reposição de Estoque</option>
                                        <option value="Logística">Frete / Entregas</option>
                                        <option value="Embalagens">Embalagens</option>
                                    </optgroup>
                                    <optgroup label="Fixo / Estrutura">
                                        <option value="Aluguel">Aluguel / Condomínio</option>
                                        <option value="Energia">Energia / Água / Internet</option>
                                        <option value="Pessoal">Salários / Pró-labore</option>
                                        <option value="Software">Sistemas / Software</option>
                                    </optgroup>
                                    <optgroup label="Estratégico">
                                        <option value="Marketing">Marketing / Tráfego</option>
                                        <option value="Impostos">Impostos / Taxas</option>
                                    </optgroup>
                                </>
                            )}
                         </select>
                    </div>

                    {formData.type === 'expense' && (
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-zinc-500 uppercase">Classificação de Custo</label>
                             <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-900 w-full border border-transparent hover:border-zinc-800 transition">
                                    <input type="radio" name="cat_type" checked={formData.category_type === 'variable'} onChange={() => setFormData({...formData, category_type: 'variable'})} className="accent-blue-500"/>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">Variável</span>
                                        <span className="text-[10px] text-zinc-500">Muda conforme vendas</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-900 w-full border border-transparent hover:border-zinc-800 transition">
                                    <input type="radio" name="cat_type" checked={formData.category_type === 'fixed'} onChange={() => setFormData({...formData, category_type: 'fixed'})} className="accent-orange-500"/>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">Fixo</span>
                                        <span className="text-[10px] text-zinc-500">Recorrente mensal</span>
                                    </div>
                                </label>
                             </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-zinc-800 mt-4">
                        <label className="flex items-center justify-between cursor-pointer p-3 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-emerald-500/50 transition-colors">
                            <span className="text-sm font-bold text-white">Já foi pago/recebido?</span>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.status === 'paid' ? 'bg-emerald-600' : 'bg-zinc-700'}`} onClick={() => setFormData({...formData, status: formData.status === 'paid' ? 'pending' : 'paid'})}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.status === 'paid' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </label>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 mt-2">
                        {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} 
                        Salvar Lançamento
                    </button>

                </form>
            </div>
        </div>
      )}

    </div>
  );
}