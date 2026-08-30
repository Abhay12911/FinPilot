import React, { useState, useEffect } from 'react';
import { getPortfolioSummary, getWatchlist, getPortfolioPerformance } from '../services/portfolio';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Plus, Filter, ArrowUpRight, ArrowDownRight, Trash2, Search, BarChart2 } from 'lucide-react';
import { SkeletonBlock, SkeletonChart } from '../components/ui/Skeleton';

const COLORS = ['#050505', '#3D3D3D', '#6B6B6B', '#9E9E9E', '#C8C8C8'];

const MOCK_HOLDINGS = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', shares: 150, avgPrice: 78.50, currentPrice: 182.45, change: 3.42, sector: 'Technology' },
  { ticker: 'AAPL', name: 'Apple Inc.', shares: 200, avgPrice: 155.20, currentPrice: 231.40, change: -0.42, sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', shares: 80, avgPrice: 310.00, currentPrice: 511.20, change: 1.24, sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 100, avgPrice: 135.60, currentPrice: 228.31, change: 2.10, sector: 'Consumer' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 50, avgPrice: 140.00, currentPrice: 198.75, change: 0.85, sector: 'Technology' },
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 shadow-xl text-left">
        <p className="text-[11px] font-bold text-[#050505]">{payload[0].name}</p>
        <p className="text-[12px] text-[#595959]">{payload[0].value.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export const Portfolio = () => {
  const [summary, setSummary] = useState(null);
  const [holdings] = useState(MOCK_HOLDINGS);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('marketValue');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, perf] = await Promise.all([getPortfolioSummary(), getPortfolioPerformance()]);
        setSummary(sum);
        setPerformanceData(perf);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading portfolio…</span>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-40" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-6 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart height={220} /></div>
          <SkeletonChart height={220} />
        </div>
      </div>
    );
  }

  const totalValue = holdings.reduce((acc, h) => acc + h.shares * h.currentPrice, 0);

  const allocationData = holdings.map((h) => ({
    name: h.ticker,
    value: ((h.shares * h.currentPrice) / totalValue) * 100,
  }));

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...holdings]
    .filter(h => h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let av, bv;
      if (sortKey === 'marketValue') { av = a.shares * a.currentPrice; bv = b.shares * b.currentPrice; }
      else if (sortKey === 'change') { av = a.change; bv = b.change; }
      else if (sortKey === 'pnl') { av = (a.currentPrice - a.avgPrice) * a.shares; bv = (b.currentPrice - b.avgPrice) * b.shares; }
      else { av = a[sortKey]; bv = b[sortKey]; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const SortTH = ({ label, k }) => (
    <th
      onClick={() => handleSort(k)}
      className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#050505] select-none"
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6">

      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Portfolio</h1>
          <p className="text-[13px] text-[#595959] mt-1">Track your holdings, performance, and allocation.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors shadow-sm">
          <Plus size={15} /> Add Holding
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL VALUE', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: '+8.42% YTD', green: true },
          { label: "TODAY'S P&L", value: `+$${summary.todaysChange.toLocaleString()}`, sub: `+${summary.todaysChangePercent}%`, green: true },
          { label: 'TOTAL RETURN', value: '+$42,840', sub: '+84.2% all-time', green: true },
          { label: 'CASH BALANCE', value: '$5,280', sub: 'Available to invest', green: null },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider mb-2">{m.label}</p>
            <p className={`text-[22px] font-bold tracking-tight ${m.green === true ? 'text-[#137333]' : 'text-[#050505]'}`}>{m.value}</p>
            <p className="text-[11px] text-[#8C8C8C] mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-mono text-[10px] text-[#8C8C8C] tracking-wider uppercase mb-1">PORTFOLIO PERFORMANCE</p>
              <p className="text-[22px] font-bold text-[#050505]">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
            <BarChart2 size={18} className="text-[#8C8C8C]" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={performanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#050505" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#050505" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8C8C8C', fontFamily: 'monospace' }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tick={{ fontSize: 10, fill: '#8C8C8C', fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Value']} />
              <Area type="monotone" dataKey="value" stroke="#050505" strokeWidth={2} fill="url(#pfGrad)" dot={false}
                activeDot={{ r: 4, fill: '#050505', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold text-[#050505] mb-4">Allocation</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allocationData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {allocationData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[12px] text-[#595959]">{item.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-[#050505]">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#F0F0F0]">
          <h3 className="font-semibold text-[#050505]">Holdings <span className="text-[#8C8C8C] font-normal text-[12px] ml-1">({sorted.length})</span></h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                aria-label="Search holdings"
                className="pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#050505] w-40"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-[#E5E5E5] rounded-lg text-[#595959] hover:bg-[#FAFAFA]">
              <Filter size={13} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <th className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider">Company</th>
                <SortTH label="Shares" k="shares" />
                <th className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">Avg Cost</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">Price</th>
                <SortTH label="Market Value" k="marketValue" />
                <SortTH label="Today's Change" k="change" />
                <SortTH label="Total P&L" k="pnl" />
                <th className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider">Weight</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => {
                const marketValue = h.shares * h.currentPrice;
                const totalPnl = (h.currentPrice - h.avgPrice) * h.shares;
                const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
                const allocation = (marketValue / totalValue) * 100;
                const todayChange = marketValue * (h.change / 100);
                const isPos = h.change >= 0;
                const isPnlPos = totalPnl >= 0;

                return (
                  <tr key={h.ticker} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[10px] font-bold text-[#050505] shrink-0">
                          {h.ticker[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[13px] text-[#050505]">{h.ticker}</div>
                          <div className="text-[11px] text-[#8C8C8C] truncate max-w-[130px]">{h.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#050505] font-medium">{h.shares.toLocaleString()}</td>
                    <td className="px-4 py-4 text-[13px] text-[#595959]">${h.avgPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-[13px] text-[#050505] font-semibold">${h.currentPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-[13px] text-[#050505] font-semibold">${marketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 text-[12px] font-semibold ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isPos ? '+' : ''}${Math.abs(todayChange).toFixed(0)} ({isPos ? '+' : ''}{h.change}%)
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[12px] font-semibold ${isPnlPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPnlPos ? '+' : ''}${totalPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        <span className="text-[10px] font-normal ml-1">({isPnlPos ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 bg-[#F0F0F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#050505] rounded-full" style={{ width: `${allocation}%` }} />
                        </div>
                        <span className="text-[11px] text-[#8C8C8C]">{allocation.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        aria-label={`Remove ${h.ticker} from holdings`}
                        className="p-1.5 text-[#ADADAD] hover:text-[#C5221F] hover:bg-[#FEF2F2] rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5221F]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
