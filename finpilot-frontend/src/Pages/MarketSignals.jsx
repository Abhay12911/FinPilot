import React, { useState, useEffect } from 'react';
import { getMarketSignals } from '../services/market';
import { SignalBadge } from '../components/ui/SignalBadge';
import { Search, Filter, Activity, ArrowRight, Zap, TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkeletonBlock, SkeletonCard } from '../components/ui/Skeleton';

const SIGNAL_TYPE_CONFIG = {
  BUY: { icon: TrendingUp, color: 'text-[#137333]', bg: 'bg-[#E8F5E9]', border: 'border-[#C8E6C9]', dot: 'bg-[#137333]' },
  SELL: { icon: TrendingDown, color: 'text-[#C5221F]', bg: 'bg-[#FEEBEE]', border: 'border-[#FFCDD2]', dot: 'bg-[#C5221F]' },
  WATCH: { icon: Activity, color: 'text-[#F57C00]', bg: 'bg-[#FFF3E0]', border: 'border-[#FFE0B2]', dot: 'bg-[#F57C00]' },
  ALERT: { icon: AlertTriangle, color: 'text-[#5C6BC0]', bg: 'bg-[#E8EAF6]', border: 'border-[#C5CAE9]', dot: 'bg-[#5C6BC0]' },
};

const FILTER_OPTIONS = ['All', 'BUY', 'SELL', 'WATCH', 'ALERT'];

const SIGNAL_STATS = [
  { label: 'Active Signals', value: '24', sub: 'Across watchlist', color: null },
  { label: 'Buy Signals', value: '12', sub: 'Strong momentum', color: '#137333' },
  { label: 'Sell Signals', value: '5', sub: 'Risk alerts', color: '#C5221F' },
  { label: 'Avg Confidence', value: '81%', sub: 'Model accuracy', color: null },
];

export const MarketSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sigs = await getMarketSignals();
        setSignals(sigs);
      } catch (error) {
        console.error('Failed to fetch market signals', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Scanning for market signals…</span>
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-7 w-52" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <SkeletonBlock className="h-4 w-40 mb-3" />
              <SkeletonBlock className="h-3 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filtered = signals.filter((s) => {
    const matchType = activeFilter === 'All' || s.type === activeFilter;
    const matchSearch = !searchQuery || s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || s.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6">

      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#8C8C8C]" />
            <p className="font-mono text-[10px] text-[#8C8C8C] tracking-widest uppercase">AI Intelligence</p>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Market Signals</h1>
          <p className="text-[13px] text-[#595959] mt-1">Real-time AI-generated insights and actionable alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ticker or company..."
              aria-label="Filter signals by ticker or company"
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[12px] text-[#050505] outline-none focus:border-[#050505] w-52"
            />
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SIGNAL_STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#E5E5E5] p-4 shadow-sm">
            <p className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider mb-2">{stat.label}</p>
            <p className="text-[22px] font-bold" style={{ color: stat.color || '#050505' }}>{stat.value}</p>
            <p className="text-[11px] text-[#8C8C8C] mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {}
      <div className="flex items-center gap-1.5 bg-[#F5F5F5] p-1 rounded-xl w-fit">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${activeFilter === f
                ? 'bg-white text-[#050505] shadow-sm'
                : 'text-[#8C8C8C] hover:text-[#050505]'
              }`}
          >
            {f}
            {f !== 'All' && (
              <span className={`ml-1.5 text-[10px] font-mono ${activeFilter === f ? 'text-[#8C8C8C]' : 'text-[#ADADAD]'}`}>
                ({signals.filter(s => s.type === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-12 text-center shadow-sm">
            <Activity size={24} className="text-[#D0D0D0] mx-auto mb-3" />
            <p className="text-[#8C8C8C] text-sm">No signals match your filters.</p>
          </div>
        )}

        {filtered.map((signal) => {
          const config = SIGNAL_TYPE_CONFIG[signal.type] || SIGNAL_TYPE_CONFIG.WATCH;
          const Icon = config.icon;

          return (
            <div
              key={signal.id}
              className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">

                {}
                <div className={`md:w-1 w-full h-1 md:h-auto shrink-0 ${config.dot}`} />

                {}
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex flex-col md:flex-row gap-5">

                    {}
                    <div className="md:w-[200px] shrink-0 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[18px] font-bold text-[#050505]">{signal.ticker}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color}`}>
                            <Icon size={10} />
                            {signal.type}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8C8C8C] leading-tight">{signal.company}</p>
                      </div>

                      <div>
                        <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider mb-1.5">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${config.dot}`}
                              style={{ width: `${signal.strength}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#050505]">{signal.strength}%</span>
                        </div>
                      </div>

                      <p className="font-mono text-[9px] text-[#8C8C8C]">{signal.timestamp}</p>
                    </div>

                    {}
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-[#F0F0F0] pt-4 md:pt-0 md:pl-6">
                      <p className="text-[13.5px] text-[#050505] leading-relaxed mb-3">{signal.explanation}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {signal.dataPoints.map((dp, i) => (
                          <span key={i} className="text-[10px] font-mono bg-[#F5F5F5] border border-[#EDEDEE] px-2 py-1 rounded-md text-[#595959]">
                            {dp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {}
                    <div className="md:w-[160px] shrink-0 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-[#F0F0F0] pt-4 md:pt-0 md:pl-6">
                      <button
                        onClick={() => navigate(`/dashboard/companies/${signal.ticker}`)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#050505] text-white text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors"
                      >
                        View Workspace <ArrowRight size={13} />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/research')}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#E5E5E5] text-[12px] font-semibold text-[#595959] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <Sparkles size={12} /> Ask AI
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MarketSignals;
