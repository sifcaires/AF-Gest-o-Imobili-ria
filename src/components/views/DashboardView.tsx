import React from 'react';
import { 
  Building2, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Payment } from '../../types';

interface DashboardViewProps {
  userName: string;
  stats: any;
  recentPayments: Payment[];
  chartData: any[];
}

export function DashboardView({ userName, stats, recentPayments, chartData }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200/80 dark:border-white/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white serif italic">Olá, {(userName || '').split(' ')[0] || 'Gestor'}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-xs">
            {userName === 'Administrador' ? 'Visão global de todos os imóveis e locações do sistema.' : 'Este é o seu panorama operacional e financeiro.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1.5 rounded-full border border-slate-200/80 dark:border-white/10 backdrop-blur-md px-3 shrink-0">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Atualizado: Agora</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Receita Mensal" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income)} 
          subValue="+12% que mês anterior" 
          icon={<DollarSign className="h-4 w-4" />}
          color="blue"
          trend="up"
        />
        <StatCard 
          title="Imóveis Ativos" 
          value={stats.propertiesCount} 
          subValue={`${stats.occupancyRate !== undefined ? stats.occupancyRate : 85}% Taxa de ocupação`} 
          icon={<Building2 className="h-4 w-4" />}
          color="purple"
        />
        <StatCard 
          title="Cobranças Pendentes" 
          value={stats.pendingPayments} 
          subValue="Vencendo nos próximos 5 dias" 
          icon={<Clock className="h-4 w-4" />}
          color="orange"
        />
        <StatCard 
          title="Inadimplência" 
          value={stats.overduePayments} 
          subValue="Crítico: Necessita atenção" 
          icon={<AlertCircle className="h-4 w-4" />}
          color="red"
          trend="down"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
          <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/0 pb-4 px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-white tracking-tight serif italic">Recebimentos Acumulados</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-widest">Performance semestral das locações</CardDescription>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '10px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden flex flex-col shadow-2xl">
          <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 py-4 px-6">
            <div className="flex items-center justify-between col-span-1">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-white tracking-tight serif italic">Pagamentos</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-widest">Atividade Recente</CardDescription>
              </div>
              <Button variant="ghost" className="h-8 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 uppercase bg-transparent px-3 rounded-lg">Histórico</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[250px]">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${
                      payment.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' :
                      payment.status === 'overdue' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400'
                    }`}>
                      {payment.status === 'paid' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white tracking-tight truncate">Boleto #{payment.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vence em: {new Date(payment.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white font-mono tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${
                      payment.status === 'paid' ? 'text-emerald-500 dark:text-emerald-400' :
                      payment.status === 'overdue' ? 'text-rose-500 dark:text-rose-400' :
                      'text-amber-500 dark:text-amber-400'
                    }`}>
                      {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 shadow-sm">
            <Button variant="ghost" className="w-full text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all h-8">Ver Relatório Completo</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color, trend }: { title: string, value: any, subValue: string, icon: any, color: string, trend?: 'up' | 'down' }) {
  const colors: Record<string, string> = {
    blue: 'bg-indigo-600 ring-indigo-500/20',
    purple: 'bg-purple-600 ring-purple-500/20',
    orange: 'bg-amber-500 ring-amber-500/20',
    red: 'bg-rose-600 ring-rose-500/20',
    emerald: 'bg-emerald-600 ring-emerald-500/20'
  };

  return (
    <Card className="border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md relative overflow-hidden group shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${colors[color]} shadow-lg transition-transform group-hover:scale-110`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tighter text-slate-800 dark:text-white">{value}</div>
        <div className="flex items-center mt-2">
          {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500 dark:text-emerald-400 mr-1" />}
          <span className={`text-[11px] font-bold tracking-tight ${trend === 'up' ? 'text-emerald-500 dark:text-emerald-400' : trend === 'down' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {subValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
