"use client";

import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  Cell, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#71717a"];

// --- GRÁFICO 1: RECEITA (LINHA) ---
export function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Tendência de Receita
      </h3>
      
      <div className="w-full h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#52525b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", color: "#fff", fontSize: "12px", borderRadius: "8px" }} 
              itemStyle={{ color: "#fff" }}
              cursor={{ stroke: '#27272a', strokeWidth: 1 }}
              formatter={(value: any) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 
                  "Vendas"
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="vendas" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVendas)"
              animationDuration={500} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- GRÁFICO 2: TOP PRODUTOS (PIZZA) ---
export function TopProductsChart({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 h-full">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Top Itens
        </h3>
        
        <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60} 
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                         itemStyle={{ color: "#fff" }}
                         formatter={(value: any) => [`${value} un.`, "Vendas"]}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-4">
            {data.map((item: any) => (
                <div key={item.name} className="flex items-center gap-2 text-[10px] text-zinc-400 truncate">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate" title={item.name}>{item.name}</span>
                </div>
            ))}
        </div>
    </div>
  );
}