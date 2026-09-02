import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompanyDetails, getCompanyNews } from '../services/companies';
import { getMarketHistory } from '../services/marketService';
import { SignalBadge } from '../components/ui/SignalBadge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Sparkles, Plus, Bookmark, ArrowUpRight, ArrowDownRight,
  FileText, Newspaper, ExternalLink, TrendingUp, DollarSign, BarChart2
} from 'lucide-react';
import { SkeletonBlock, SkeletonChart } from '../components/ui/Skeleton';

const TABS = ['Overview', 'Financials', 'News', 'AI Analysis'];

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y'];

// Financial data is now fetched directly from the backend.

const StockTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2.5 shadow-xl">
        <p className="text-[10px] font-mono text-[#8C8C8C] mb-0.5">{label}</p>
        <p className="text-[15px] font-bold text-[#050505]">${payload[0].value?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export const CompanyWorkspace = () => {
  const { ticker = 'NVDA' } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeFilter, setTimeFilter] = useState('1M');
  const [company, setCompany] = useState(null);
  const [news, setNews] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [comp, n, hist] = await Promise.all([
          getCompanyDetails(ticker),
          getCompanyNews(ticker),
          getMarketHistory(ticker, '1day', 30).catch(() => null)
        ]);
        setCompany(comp);
        setNews(n);
        if (hist && hist.data && hist.data.length > 0) {
          const formattedHist = hist.data.map(d => ({
            date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: d.close
          }));
          setChartData(formattedHist.reverse());
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error('Failed to fetch company data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticker]);

  if (loading || !company) {
    return (
      <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading {ticker}…</span>
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <SkeletonBlock className="w-14 h-14 rounded-xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-48" />
                <SkeletonBlock className="h-3 w-32" />
              </div>
            </div>
            <SkeletonBlock className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart height={280} /></div>
          <div className="space-y-5">
            <SkeletonChart height={140} />
            <SkeletonChart height={140} />
          </div>
        </div>
      </div>
    );
  }

  const isPositive = company.change >= 0;
  const chartColor = isPositive ? '#137333' : '#C5221F';
  const gradientId = `grad-${ticker}`;

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6">

      {}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

          {}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-xl font-bold text-[#050505] shrink-0">
              {company.ticker[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-xl font-bold tracking-tight text-[#050505]">{company.name}</h1>
                <span className="font-mono text-[11px] font-bold bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded text-[#595959]">
                  {company.ticker}
                </span>
                <SignalBadge type="BUY" />
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#8C8C8C] flex-wrap">
                <span>{company.sector}</span>
                <span>·</span>
                <span>{company.industry}</span>
                <span>·</span>
                <span className="font-medium text-[#595959]">Mkt Cap: {company.marketCap}</span>
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-end gap-3">
              <span className="text-[32px] font-bold tracking-tight text-[#050505] leading-none">
                ${company.price.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 font-semibold text-[15px] mb-0.5 ${isPositive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {isPositive ? '+' : ''}{company.change.toFixed(2)} ({isPositive ? '+' : ''}{company.changePercent.toFixed(2)}%)
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[12px] font-semibold text-[#595959] hover:bg-[#FAFAFA] transition-colors">
                <Bookmark size={13} /> Watchlist
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[12px] font-semibold text-[#595959] hover:bg-[#FAFAFA] transition-colors">
                <Plus size={13} /> Add to Portfolio
              </button>
              <button
                onClick={() => navigate('/dashboard/research')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] text-white text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors"
              >
                <Sparkles size={13} /> Ask FinPilot
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex items-center gap-0 border-b border-[#E5E5E5] overflow-x-auto no-scrollbar bg-white rounded-t-xl px-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-[#050505]' : 'text-[#8C8C8C] hover:text-[#595959]'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#050505] rounded-t" />
            )}
          </button>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 space-y-5">

          {}
          {activeTab === 'Overview' && (
            <>
              {}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-mono text-[10px] text-[#8C8C8C] tracking-wider uppercase mb-0.5">Price Action</p>
                    <p className="text-[18px] font-bold text-[#050505]">${company.price.toFixed(2)}</p>
                  </div>
                  <div className="flex bg-[#F5F5F5] rounded-lg p-1 gap-0.5">
                    {TIME_FILTERS.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeFilter(tf)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${tf === timeFilter ? 'bg-white text-[#050505] shadow-sm' : 'text-[#8C8C8C] hover:text-[#050505]'
                          }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.12} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#8C8C8C', fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        interval={6}
                        dy={6}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: '#8C8C8C', fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v.toFixed(0)}`}
                      />
                      <Tooltip content={<StockTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{ r: 4, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-[220px] flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]">
                    <p className="text-[13px] text-[#8C8C8C]">Historical chart data unavailable</p>
                  </div>
                )}
              </div>

              {}
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
                <h3 className="font-semibold text-[#050505] mb-3">About {company.name}</h3>
                <p className="text-[13.5px] text-[#595959] leading-relaxed">{company.about}</p>
              </div>
            </>
          )}

          {}
          {activeTab === 'Financials' && (
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
              <h3 className="font-semibold text-[#050505] mb-5">Financial Highlights (TTM)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(company.financials).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-xl border border-[#F0F0F0] bg-[#FAFAFA]">
                    <p className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-[16px] font-bold text-[#050505]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {activeTab === 'News' && (
            <div className="space-y-3">
              {news.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm hover:border-[#D0D0D0] transition-colors cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-[14px] font-semibold text-[#050505] mb-2 leading-snug group-hover:underline">{item.title}</h4>
                      <p className="text-[12px] text-[#8C8C8C] line-clamp-2 mb-3">{item.summary}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-[#F5F5F5] px-2 py-0.5 rounded text-[#595959]">{item.source}</span>
                        <span className="text-[10px] text-[#ADADAD]">{item.time}</span>
                        {item.sentiment && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.sentiment === 'Positive' ? 'bg-[#E8F5E9] text-[#137333]' :
                              item.sentiment === 'Negative' ? 'bg-[#FEEBEE] text-[#C5221F]' :
                                'bg-[#F5F5F5] text-[#8C8C8C]'
                            }`}>
                            {item.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-[#ADADAD] group-hover:text-[#595959] shrink-0 mt-0.5 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {}
          {activeTab === 'AI Analysis' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#050505] flex items-center justify-center">
                    <Sparkles size={14} className="text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#050505] leading-none">FinPilot AI Synthesis</h3>
                    <p className="text-[10px] text-[#8C8C8C] mt-0.5">Based on latest filings and market data</p>
                  </div>
                </div>
                <p className="text-[13.5px] text-[#050505] leading-relaxed mb-4">{company.aiSummary}</p>

                <p className="text-[12px] text-[#8C8C8C] italic mb-4">
                  For a detailed bull/bear analysis, run a Deep Research report or ask FinPilot AI directly in the chat.
                </p>

                <div className="flex gap-2 mt-4 pt-4 border-t border-[#F0F0F0]">
                  <button
                    onClick={() => navigate('/dashboard/research')}
                    className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 bg-[#050505] text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
                  >
                    <Sparkles size={12} /> Deep Research
                  </button>
                  <button className="text-[12px] font-semibold px-4 py-2 border border-[#E5E5E5] text-[#595959] rounded-lg hover:bg-[#FAFAFA] transition-colors">
                    Analyze Risks
                  </button>
                  <button className="text-[12px] font-semibold px-4 py-2 border border-[#E5E5E5] text-[#595959] rounded-lg hover:bg-[#FAFAFA] transition-colors">
                    Compare
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {}
        <div className="space-y-5">

          {}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#050505]">Key Metrics</h3>
              <BarChart2 size={14} className="text-[#8C8C8C]" />
            </div>
            <div className="space-y-2.5">
              {Object.entries(company.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#8C8C8C]">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-[12px] font-semibold text-[#050505]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#050505]">Financials (TTM)</h3>
              <DollarSign size={14} className="text-[#8C8C8C]" />
            </div>
            <div className="space-y-2.5">
              {Object.entries(company.financials).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#8C8C8C]">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-[12px] font-semibold text-[#050505]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#050505]">Latest News</h3>
              <Newspaper size={13} className="text-[#8C8C8C]" />
            </div>
            <div className="space-y-4">
              {news.slice(0, 3).map((item) => (
                <div key={item.id} className="cursor-pointer group">
                  <h4 className="text-[12px] font-medium text-[#050505] group-hover:underline line-clamp-2 leading-snug mb-1">{item.title}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-[#ADADAD]">{item.source}</span>
                    <span className="text-[10px] text-[#D0D0D0]">·</span>
                    <span className="text-[10px] text-[#ADADAD]">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyWorkspace;
