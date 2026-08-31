import React, { useState, useEffect, useRef } from 'react';
import { getPortfolioSummary, getPortfolioPerformance, getWatchlist } from '../services/portfolio';
import { Sparkles, Plus, ArrowRight, TrendingUp, TrendingDown, Activity, Brain, AlertTriangle, FileText, BarChart2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignalBadge } from '../components/ui/SignalBadge';
import { SkeletonBlock, SkeletonCard, SkeletonChart } from '../components/ui/Skeleton';

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const AI_SUGGESTIONS = [
  'Analyze NVIDIA\'s latest earnings',
  'Compare Apple vs Microsoft',
  'What are the biggest risks in my portfolio?',
  'Summarize Apple\'s latest 10-K',
];

const ATTENTION_ITEMS = [
  {
    ticker: 'NVDA',
    headline: 'Volatility increased',
    explanation: '30-day volatility is above its recent average.',
    actionText: 'View analysis →',
    path: '/dashboard/companies/NVDA',
    badgeType: 'ALERT',
  },
  {
    ticker: 'AAPL',
    headline: 'Earnings tomorrow',
    explanation: 'Consensus EPS of $1.62. Implied options move is ±4.5%.',
    actionText: 'View details →',
    path: '/dashboard/companies/AAPL',
    badgeType: 'WATCH',
  },
  {
    ticker: 'Portfolio',
    headline: 'Tech sector exposure reached 42%',
    explanation: 'Highly concentrated. Consider diversification triggers.',
    actionText: 'Analyze risk →',
    path: '/dashboard/personal-analyzer',
    badgeType: 'ALERT',
  },
  {
    ticker: 'Filings',
    headline: '3 New filings available',
    explanation: 'Form 4 filings indexed for watchlisted stocks.',
    actionText: 'Open documents →',
    path: '/dashboard/documents',
    badgeType: 'BUY',
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-[11px] font-mono text-[#8C8C8C] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[18px] font-bold text-[#050505]">${val?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const MiniSparkline = ({ data, isPositive }) => (
  <ResponsiveContainer width="100%" height={36}>
    <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={isPositive ? '#137333' : '#C5221F'}
        strokeWidth={1.5}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const Overview = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('1M');
  const [aiQuery, setAiQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, perf, watch] = await Promise.all([
          getPortfolioSummary(),
          getPortfolioPerformance(),
          getWatchlist(),
        ]);
        setSummary(sum);
        setPerformanceData(perf);
        setWatchlist(watch);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateSparkline = (isPositive) => {
    const data = [];
    let val = 100;
    for (let i = 0; i < 20; i++) {
      val += (Math.random() - (isPositive ? 0.35 : 0.65)) * 4;
      data.push({ value: Math.max(80, val) });
    }
    return data;
  };

  if (loading || !summary) {
    return (
      <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your dashboard…</span>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-7 w-64" />
          </div>
          <div className="flex gap-2.5">
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart height={260} /></div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-3">
            <SkeletonBlock className="h-4 w-28 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  const isPortfolioPositive = summary.ytdReturn >= 0;

  const enrichedWatchlist = watchlist.map(s => ({
    ...s,
    sparkline: generateSparkline(s.changePercent >= 0),
  }));

  const userDisplayName = user?.name ? (user.name.includes('@') ? user.name.split('@')[0] : user.name) : 'User';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6">

      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#050505]">{greeting}, {userDisplayName} 👋</h1>
          <p className="text-[13px] text-[#595959] mt-0.5">Here's what changed across your portfolio and watchlist today.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/dashboard/portfolio')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E5E5E5] text-[12px] font-bold text-[#050505] hover:bg-[#FAFAFA] transition-colors shadow-xs"
          >
            <Plus size={14} />
            Add Holding
          </button>
          <button
            onClick={() => navigate('/dashboard/research')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] text-white text-[12px] font-bold hover:bg-[#1A1A1A] transition-colors shadow-xs"
          >
            <Sparkles size={14} />
            Ask FinPilot AI
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'PORTFOLIO VALUE',
            value: `$${summary.portfolioValue.toLocaleString()}`,
            sub: `${isPortfolioPositive ? '+' : ''}${summary.ytdReturn}% YTD`,
            isPositive: isPortfolioPositive,
          },
          {
            label: "TODAY'S CHANGE",
            value: `+$${summary.todaysChange.toLocaleString()}`,
            sub: `+${summary.todaysChangePercent}% vs yesterday`,
            isPositive: true,
          },
          {
            label: 'WATCHLIST',
            value: `${summary.watchlistTotal} Companies`,
            sub: `${summary.watchlistActive} active signals`,
            isPositive: null,
          },
          {
            label: 'AI RESEARCH',
            value: `${summary.aiReportsTotal} Reports`,
            sub: `${summary.aiReportsThisWeek} this week`,
            isPositive: null,
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#E5E5E5] p-4 shadow-xs">
            <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-xl font-bold tracking-tight text-[#050505] leading-none mb-1.5">{card.value}</p>
            <p className={`text-[11px] font-semibold ${
              card.isPositive === true ? 'text-[#137333]' :
              card.isPositive === false ? 'text-[#C5221F]' :
              'text-[#8C8C8C]'
            }`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs">
        <h3 className="text-xs font-mono font-bold text-[#8C8C8C] uppercase tracking-widest mb-4">ATTENTION</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] pb-2 text-[10px] font-mono text-[#8C8C8C] uppercase tracking-wider">
                <th className="pb-2 font-semibold w-[100px]">Status</th>
                <th className="pb-2 font-semibold">Event</th>
                <th className="pb-2 font-semibold hidden md:table-cell">Details</th>
                <th className="pb-2 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {ATTENTION_ITEMS.map((item, idx) => (
                <tr key={idx} className="border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3 pr-2">
                    <span className={`inline-flex items-center justify-center font-mono font-bold text-[9px] px-2 py-0.5 rounded ${
                      item.badgeType === 'ALERT' ? 'bg-[#FEEBEE] text-[#C5221F] border border-[#FFCDD2]' :
                      item.badgeType === 'WATCH' ? 'bg-[#FFF3E0] text-[#F57C00] border border-[#FFE0B2]' :
                      'bg-[#E8F5E9] text-[#137333] border border-[#C8E6C9]'
                    }`}>
                      {item.ticker}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-[#050505]">{item.headline}</td>
                  <td className="py-3 text-[#595959] hidden md:table-cell">{item.explanation}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => navigate(item.path)}
                      className="text-[12px] font-semibold text-[#050505] hover:underline cursor-pointer"
                    >
                      {item.actionText}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-[9px] text-[#8C8C8C] tracking-wider uppercase mb-1">PORTFOLIO PERFORMANCE</p>
                <div className="flex items-end gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-[#050505]">
                    ${summary.portfolioValue.toLocaleString()}
                  </h2>
                  <span className="text-[12px] font-bold text-[#137333] mb-0.5">
                    +{summary.ytdReturn}%
                  </span>
                </div>
              </div>
              <div className="flex bg-[#F5F5F5] rounded-lg p-0.5 gap-0.5 font-mono">
                {TIME_FILTERS.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveFilter(tf)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${tf === activeFilter
                        ? 'bg-white text-[#050505] shadow-xs'
                        : 'text-[#8C8C8C] hover:text-[#050505]'
                      }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-48 my-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#050505" stopOpacity={0.06} />
                      <stop offset="95%" stopColor="#050505" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#8C8C8C', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#8C8C8C', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#050505"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#050505', stroke: '#fff', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {}
          <div className="border-t border-[#F5F5F5] pt-4 mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="border-r border-[#F0F0F0]">
              <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider">Best Performer</p>
              <p className="text-[12.5px] font-bold text-[#137333] mt-0.5">NVDA (+128.06%)</p>
            </div>
            <div className="border-r border-[#F0F0F0]">
              <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider">Worst Performer</p>
              <p className="text-[12.5px] font-bold text-[#C5221F] mt-0.5">AAPL (-2.42%)</p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider">Largest Allocation</p>
              <p className="text-[12.5px] font-bold text-[#050505] mt-0.5">NVDA (48%)</p>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#050505] text-[13px]">Your Watchlist</h3>
              <button
                onClick={() => navigate('/dashboard/watchlist')}
                className="text-[11px] font-bold text-[#8C8C8C] flex items-center gap-0.5 hover:text-[#050505] transition-colors"
              >
                Manage <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-1.5">
              {enrichedWatchlist.slice(0, 4).map((stock) => {
                const isPositive = stock.changePercent >= 0;
                return (
                  <div
                    key={stock.ticker}
                    onClick={() => navigate(`/dashboard/companies/${stock.ticker}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-[#E5E5E5] hover:bg-[#FAFAFA] cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-[13px] font-bold text-[#050505]">{stock.ticker}</span>
                      <span className="text-[10px] text-[#8C8C8C] ml-2 truncate max-w-[80px] inline-block align-bottom">{stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] font-bold ${isPositive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                      <SignalBadge type={stock.signal} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/watchlist')}
            className="w-full text-center mt-4 pt-3 border-t border-[#F5F5F5] text-[11px] font-bold text-[#595959] hover:text-[#050505]"
          >
            View Full Watchlist
          </button>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#050505] flex items-center justify-center">
            <Sparkles size={14} className="text-white fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-[14px] text-[#050505] leading-none">Ask FinPilot AI</h3>
            <p className="text-[11px] text-[#8C8C8C] mt-1">Research companies, analyze filings, compare businesses, and uncover risks.</p>
          </div>
        </div>

        {}
        <div className="flex flex-wrap gap-2 mb-4">
          {AI_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setAiQuery(s); inputRef.current?.focus(); }}
              className="px-3 py-1.5 text-[11.5px] bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#595959] rounded-lg transition-colors border border-transparent"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (aiQuery.trim()) navigate('/dashboard/research'); }}
          className="relative"
        >
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            <Sparkles size={14} className="text-[#8C8C8C]" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="What would you like to analyze? e.g. 'Analyze NVDA cash flow trend'"
            className="w-full h-11 pl-10 pr-24 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[13px] text-[#050505] placeholder-[#ADADAD] outline-none focus:bg-white focus:border-[#050505] transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#050505] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1A1A1A]"
          >
            Analyze
          </button>
        </form>
      </div>

    </div>
  );
};

export default Overview;
