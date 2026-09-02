import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCompanyDetails } from '../services/companies';
import { SkeletonTable } from '../components/ui/Skeleton';

const METRICS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'revenueGrowth', label: 'Revenue Growth YoY' },
  { key: 'eps', label: 'EPS ($)' },
  { key: 'grossMargin', label: 'Gross Margin' },
  { key: 'opMargin', label: 'Operating Margin' },
  { key: 'netMargin', label: 'Net Income' },
  { key: 'pe', label: 'P/E Ratio' },
  { key: 'ps', label: 'P/S Ratio' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'fcf', label: 'Free Cash Flow' },
];

const COLORS = ['#050505', '#525252', '#737373', '#A3A3A3', '#D9D9D9'];

export const Compare = () => {
  const [selected, setSelected] = useState(['AAPL', 'MSFT', 'NVDA']);
  const [inputValue, setInputValue] = useState('');
  const [companiesData, setCompaniesData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCompanyData = async (ticker) => {
    try {
      const data = await getCompanyDetails(ticker);
      setCompaniesData(prev => ({
        ...prev,
        [ticker]: {
          name: data.name,
          revenue: data.financials.revenue,
          revenueGrowth: data.financials.revenueGrowth,
          grossMargin: data.financials.grossMargin,
          opMargin: data.financials.operatingMargin,
          netMargin: data.financials.netIncome,
          pe: data.metrics.peRatio,
          ps: data.metrics.priceToSales,
          marketCap: data.marketCap,
          fcf: data.financials.freeCashFlow,
          // Extract numeric values for charts
          _revenueGrowthNum: parseFloat((data.financials.revenueGrowth || '0').replace(/[^0-9.-]/g, '')) || 0
        }
      }));
    } catch (e) {
      console.error(`Failed to fetch data for ${ticker}`, e);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all(selected.map(ticker => fetchCompanyData(ticker)));
      setLoading(false);
    };
    loadInitialData();
  }, []); // Run once on mount

  const addCompany = async () => {
    const ticker = inputValue.trim().toUpperCase();
    if (ticker && !selected.includes(ticker) && selected.length < 5) {
      setSelected(prev => [...prev, ticker]);
      setInputValue('');
      await fetchCompanyData(ticker);
    }
  };

  const removeCompany = (ticker) => setSelected(prev => prev.filter(t => t !== ticker));

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading comparison data…</span>
        <SkeletonTable rows={10} cols={4} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Compare</h1>
        <p className="text-[13px] text-[#595959] mt-1">Side-by-side comparison of up to 5 companies.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selected.map((ticker, i) => (
          <div key={ticker} className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-[13px] font-semibold transition-transform hover:scale-[1.02]" style={{ borderColor: COLORS[i] }}>
            <span style={{ color: COLORS[i] }}>{ticker}</span>
            <span className="text-[#8C8C8C] font-normal text-[11px]">{companiesData[ticker]?.name || 'Loading...'}</span>
            <button onClick={() => removeCompany(ticker)} aria-label={`Remove ${ticker} from comparison`} className="text-[#8C8C8C] hover:text-red-500 ml-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 rounded-full">
              <X size={13} />
            </button>
          </div>
        ))}
        {selected.length < 5 && (
          <div className="flex items-center gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompany()}
              placeholder="Add ticker (e.g. GOOGL)"
              aria-label="Add company ticker to comparison"
              className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505] w-44"
            />
            <button onClick={addCompany} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <th className="px-5 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider w-40">Metric</th>
              {selected.map((ticker, i) => (
                <th key={ticker} className="px-5 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="font-bold text-[14px] text-[#050505]">{ticker}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, idx) => {
              return (
                <tr key={metric.key} className={`border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors ${idx % 2 === 0 ? '' : 'bg-[#FAFAFA]/50'}`}>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">{metric.label}</td>
                  {selected.map((ticker) => {
                    const val = companiesData[ticker]?.[metric.key];
                    return (
                      <td key={ticker} className="px-5 py-3">
                        <span className="text-[14px] font-semibold text-[#050505]">
                          {val || '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-[#050505] mb-4">Revenue Growth YoY (%)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={selected.map((t, i) => ({ name: t, value: companiesData[t]?._revenueGrowthNum || 0, color: COLORS[i] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Revenue Growth']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {selected.map((t, i) => <Cell key={t} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm flex items-center justify-between">
        <p className="text-[13px] text-[#595959]">Want a detailed AI comparison summary of {selected.join(' vs ')}?</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
          <Sparkles size={14} className="fill-white" /> Ask FinPilot to Compare
        </button>
      </div>
    </div>
  );
};

export default Compare;
