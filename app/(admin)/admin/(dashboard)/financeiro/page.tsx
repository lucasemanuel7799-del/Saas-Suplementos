"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Filter, CheckCircle2, AlertCircle, X, Loader2,
  PieChart as PieIcon, BarChart3
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { toast } from "sonner";

export default function FinancePage() {
  const supabase = createClient();
  
  // Dados
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de Visualização
  const [filterType, setFilterType] = useState("all"); // all, income, expense
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, pending

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulário
  const [formData, setFormData] = useState({
      description: "",
      amount: "",
      type: "expense", // income | expense
      category_type: "variable", // fixed | variable
      status: "paid", // paid | pending
      due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("store_id", user?.id)
      .order("due_date", { ascending: false }); // Mais recentes primeiro

    if (data) setTransactions(data);
    setLoading(false);
  }

  // --- CÁLCULOS DOS KPI ---
  const summary = transactions.reduce((acc, t) => {
    const val = parseFloat(t.amount);
    
    if (t.type === 'income') {
        acc.totalIncome += val;
        if (t.status === 'pending') acc.pendingReceive += val;
    } else {
        acc.totalExpense += val;
        if (t.status === 'pending') acc.pendingPay += val;
    }
    
    // Saldo Real (Apenas o que já foi pago/recebido)
    if (t.status === 'paid') {
        if (t.type === 'income') acc.balance += val;
        else acc.balance -= val;
    }

    return acc;
  }, { totalIncome: 0, totalExpense: 0, balance: 0, pendingPay: 0, pendingReceive: 0 });

  // --- DADOS PARA GRÁFICOS ---
  
  // 1. Gráfico de Pizza (Fixas vs Variáveis - Despesas)
  const expenses = transactions.filter(t => t.type === 'expense');
  const fixedTotal = expenses.filter(t => t.category_type === 'fixed').reduce((acc, t) => acc + t.amount, 0);
  const variableTotal = expenses.filter(t => t.category_type === 'variable').reduce((acc, t) => acc + t.amount, 0);
  
  const pieData = [
    { name: 'Custos Fixos', value: fixedTotal, color: '#f97316' }, // Orange
    { name: 'Custos Variáveis', value: variableTotal, color: '#3b82f6' }, // Blue
  ];

  // 2. Gráfico de Barras (Receita vs Despesa) - Simples (Total)
  const barData = [
    { name: 'Entradas', valor: summary.totalIncome },
    { name: 'Saídas', valor: summary.totalExpense },
  ];

  // --- FUNÇÕES ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from("transactions").insert({
            store_id: user?.id,
            description: formData.description,
            amount: parseFloat(formData.amount),
            type: formData.type,
            category_type: formData.category_type,
            status: formData.status,
            due_date: formData.due_date,
            payment_date: formData.status === 'paid' ? new Date() : null
        });

        if (error) throw error;
        toast.success("Lançamento salvo!");
        setFormData({ description: "", amount: "", type: "expense", category_type: "variable", status: "paid", due_date: new Date().toISOString().split('T')[0] });
        setIsModalOpen(false);
        fetchTransactions();
    } catch (e) {
        toast.error("Erro ao salvar.");
    } finally {
        setIsSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Excluir este lançamento?")) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
    toast.success("Excluído.");
  };

  const markAsPaid = async (t: any) => {
    const newStatus = t.status === 'paid' ? 'pending' : 'paid';
    setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, status: newStatus } : item));
    await supabase.from("transactions").update({ status: newStatus }).eq("id", t.id);
    toast.success(`Status alterado para ${newStatus === 'paid' ? 'Pago' : 'Pendente'}`);
  };

  // Filtragem da Tabela
  const filteredTransactions = transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
  });

  return (
    <div className="space-y-6 h-full flex flex-col overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-zinc-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
            <p className="text-zinc-400 text-sm mt-1">Controle de caixa, contas a pagar e receber.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
            <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      {/* KPIS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
         {/* Saldo */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Saldo em Caixa</span>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><DollarSign size={18}/></div>
            </div>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-white' : 'text-red-500'}`}>
                R$ {summary.balance.toFixed(2).replace('.', ',')}
            </p>
         </div>

         {/* Contas a Pagar */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">A Pagar (Pendente)</span>
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><AlertCircle size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-red-400">
                R$ {summary.pendingPay.toFixed(2).replace('.', ',')}
            </p>
         </div>

         {/* Receita Total */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Entradas (Total)</span>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><TrendingUp size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-blue-400">
                R$ {summary.totalIncome.toFixed(2).replace('.', ',')}
            </p>
         </div>

         {/* Despesa Total */}
         <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Saídas (Total)</span>
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><TrendingDown size={18}/></div>
            </div>
            <p className="text-2xl font-bold text-orange-400">
                R$ {summary.totalExpense.toFixed(2).replace('.', ',')}
            </p>
         </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
         
         {/* Gráfico 1: Barras (Entradas vs Saídas) */}
         <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500"/> Visão Geral (Balanço)
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{fill: '#27272a'}}
                        />
                        <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Gráfico 2: Pizza (Fixas vs Variáveis) */}
         <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <PieIcon size={16} className="text-orange-500"/> Composição de Custos
            </h3>
            <div className="h-64 w-full relative">
                {fixedTotal + variableTotal === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs">Sem dados de despesas</div>
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
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
                {/* Texto no meio */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-xs font-bold text-zinc-500">Despesas</span>
                </div>
            </div>
         </div>
      </div>

      {/* TABELA DE LANÇAMENTOS */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
         
         {/* Filtros da Tabela */}
         <div className="p-4 border-b border-zinc-800 flex flex-wrap gap-4 items-center bg-zinc-900/50">
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold uppercase"><Filter size={14}/> Filtros:</div>
            
            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Tudo</button>
                <button onClick={() => setFilterType('income')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterType === 'income' ? 'bg-emerald-500/20 text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Receitas</button>
                <button onClick={() => setFilterType('expense')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterType === 'expense' ? 'bg-red-500/20 text-red-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Despesas</button>
            </div>

            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterStatus === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Tudo</button>
                <button onClick={() => setFilterStatus('paid')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterStatus === 'paid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Pago / Recebido</button>
                <button onClick={() => setFilterStatus('pending')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${filterStatus === 'pending' ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>Pendente</button>
            </div>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs">
                     <tr>
                         <th className="px-6 py-4">Descrição</th>
                         <th className="px-6 py-4 text-center">Tipo</th>
                         <th className="px-6 py-4 text-center">Vencimento</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Ações</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800/50">
                    {loading ? <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Carregando...</td></tr> : 
                     filteredTransactions.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-zinc-500">Nenhum lançamento encontrado.</td></tr> :
                     filteredTransactions.map((t) => (
                         <tr key={t.id} className="hover:bg-zinc-800/30">
                             <td className="px-6 py-4 font-bold text-white">{t.description}</td>
                             <td className="px-6 py-4 text-center">
                                 <div className="flex flex-col items-center gap-1">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {t.type === 'income' ? 'Entrada' : 'Saída'}
                                    </span>
                                    {t.type === 'expense' && (
                                        <span className="text-[10px] text-zinc-500">
                                            {t.category_type === 'fixed' ? 'Fixo' : 'Variável'}
                                        </span>
                                    )}
                                 </div>
                             </td>
                             <td className="px-6 py-4 text-center text-zinc-400 font-mono text-xs">
                                 {new Date(t.due_date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {t.type === 'expense' && "- "}R$ {t.amount.toFixed(2).replace('.', ',')}
                             </td>
                             <td className="px-6 py-4 text-center">
                                 <button onClick={() => markAsPaid(t)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border transition-all ${t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'}`}>
                                    {t.status === 'paid' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                    {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                 </button>
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <button onClick={() => deleteTransaction(t.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><X size={16} /></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </div>

      {/* --- MODAL DE NOVO LANÇAMENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Novo Lançamento</h2>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-zinc-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    
                    <div className="flex gap-4">
                         <div className="flex-1 space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Tipo</label>
                            <select 
                                value={formData.type} 
                                onChange={e => setFormData({...formData, type: e.target.value})}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-orange-500 outline-none"
                            >
                                <option value="expense">Saída (Despesa)</option>
                                <option value="income">Entrada (Receita)</option>
                            </select>
                         </div>
                         {formData.type === 'expense' && (
                             <div className="flex-1 space-y-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Categoria</label>
                                <select 
                                    value={formData.category_type} 
                                    onChange={e => setFormData({...formData, category_type: e.target.value})}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-orange-500 outline-none"
                                >
                                    <option value="variable">Variável</option>
                                    <option value="fixed">Fixa</option>
                                </select>
                             </div>
                         )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                        <input required autoFocus value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Conta de Luz, Venda Balcão..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-orange-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Valor (R$)</label>
                            <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-orange-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Vencimento</label>
                            <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:border-orange-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Status Inicial</label>
                        <div className="flex gap-4 pt-1">
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" name="status" checked={formData.status === 'paid'} onChange={() => setFormData({...formData, status: 'paid'})} className="accent-emerald-500"/>
                                 <span className="text-sm text-zinc-300">Pago / Recebido</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" name="status" checked={formData.status === 'pending'} onChange={() => setFormData({...formData, status: 'pending'})} className="accent-orange-500"/>
                                 <span className="text-sm text-zinc-300">Pendente (Agendar)</span>
                             </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={isSaving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Salvar Lançamento
                        </button>
                    </div>

                </form>
            </div>
        </div>
      )}

    </div>
  );
}