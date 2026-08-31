import React from 'react';
import { Sparkles, TrendingUp, Activity, Shield, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SECTOR_DATA = [
  { name: 'Technology', value: 72, color: '#050505' },
  { name: 'Consumer', value: 12, color: '#525252' },
  { name: 'Healthcare', value: 8, color: '#8C8C8C' },
  { name: 'Energy', value: 5, color: '#C0C0C0' },
  { name: 'Other', value: 3, color: '#E5E5E5' },
];

const AI_INSIGHTS = [
  { text: 'Your portfolio is heavily exposed to technology.', detail: '72% allocation vs 27% S&P 500 benchmark.', type: 'warning', icon: Activity },
  { text: 'NVDA contributed most to today\'s gain (+$812).', detail: '28.6% of daily P&L from a single position.', type: 'info', icon: TrendingUp },
  { text: 'Portfolio concentration increased this month.', detail: 'Top 3 holdings now represent 68% of portfolio.', type: 'warning', icon: Shield },
];

export const PersonalAnalyzer = () => {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Personal Analyzer</h1>
          <p className="text-[13px] text-[#595959] mt-1">AI-powered analysis of your personal portfolio health and risk.</p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'OVERALL SCORE', value: '78/100', color: '#050505', sub: 'Good' },
          { label: 'RISK SCORE', value: 'Medium', color: '#92400E', sub: 'Beta 1.24' },
          { label: 'DIVERSIFICATION', value: '62/100', color: '#050505', sub: 'Moderate' },
          { label: 'VOLATILITY', value: '18.4%', color: '#050505', sub: 'Annualized' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#D9D9D9] transition-all duration-200">
            <p className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider mb-2">{m.label}</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[11px] text-[#8C8C8C] mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-[#050505] mb-4">Sector Exposure</h3>
          <div className="h-40 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SECTOR_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {SECTOR_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {SECTOR_DATA.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                  <span className="text-[13px] text-[#050505]">{s.name}</span>
                </div>
                <span className="font-semibold text-[13px] text-[#050505]">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-[#050505] mb-4">Performance</h3>
          <div className="space-y-4">
            {[
              { label: "Today's P&L", value: '+$2,840', change: '+2.26%', positive: true },
              { label: 'Weekly Return', value: '+$4,120', change: '+3.32%', positive: true },
              { label: 'Monthly Return', value: '+$9,200', change: '+7.72%', positive: true },
              { label: 'Yearly Return', value: '+$18,240', change: '+16.6%', positive: true },
              { label: 'Max Drawdown', value: '-$8,400', change: '-6.1%', positive: false },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0">
                <span className="text-[13px] text-[#8C8C8C]">{p.label}</span>
                <div className="text-right">
                  <span className={`font-semibold text-[13px] ${p.positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>{p.value}</span>
                  <span className={`text-[11px] ml-2 ${p.positive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>{p.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-[#050505] mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Portfolio Beta', value: '1.24', desc: 'High market sensitivity' },
              { label: 'Volatility', value: '18.4%', desc: 'Annualized std deviation' },
              { label: 'Max Drawdown', value: '-6.1%', desc: 'Peak-to-trough decline' },
              { label: 'Sharpe Ratio', value: '1.82', desc: 'Risk-adjusted return' },
              { label: 'Concentration', value: '68%', desc: 'Top 3 holdings weight' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0">
                <div>
                  <p className="text-[13px] text-[#050505] font-medium">{r.label}</p>
                  <p className="text-[11px] text-[#8C8C8C]">{r.desc}</p>
                </div>
                <span className="font-bold text-[14px] text-[#050505]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={16} className="text-[#050505]" />
          <h3 className="font-semibold text-[#050505]">AI Insights</h3>
        </div>
        <div className="space-y-4">
          {AI_INSIGHTS.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={`rounded-xl border p-4 flex items-start gap-4 transition-shadow hover:shadow-sm ${insight.type === 'warning' ? 'border-[#FDE68A] bg-[#FFFDE7]' : 'border-[#E5E5E5] bg-[#FAFAFA]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${insight.type === 'warning' ? 'bg-[#FEF3C7]' : 'bg-[#F5F5F5]'}`}>
                  <Icon size={16} className={insight.type === 'warning' ? 'text-[#92400E]' : 'text-[#050505]'} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[14px] text-[#050505]">{insight.text}</p>
                  <p className="text-[13px] text-[#595959] mt-1">{insight.detail}</p>
                </div>
                <button aria-label={`Ask FinPilot AI about: ${insight.text}`} className="flex items-center gap-1 text-[12px] font-medium text-[#8C8C8C] hover:text-[#050505] shrink-0 mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] rounded">
                  Ask AI <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersonalAnalyzer;
